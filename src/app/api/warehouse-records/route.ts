import { db } from "@/server/db";
import { warehouseRecords, shipments } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: 获取仓库记录，可选按货物ID筛选
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shipmentId = url.searchParams.get("shipmentId");
    
    // 查询条件
    let records;
    if (shipmentId) {
      records = await db.query.warehouseRecords.findMany({
        where: eq(warehouseRecords.shipmentId, parseInt(shipmentId)),
        with: {
          shipment: true
        }
      });
    } else {
      records = await db.query.warehouseRecords.findMany({
        with: {
          shipment: true
        },
        orderBy: [warehouseRecords.inboundDate]
      });
    }
    
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching warehouse records:", error);
    return NextResponse.json(
      { error: "获取仓库记录失败" },
      { status: 500 }
    );
  }
}

// POST: 创建新入库记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.shipmentId) {
      return NextResponse.json(
        { error: "缺少货物ID" },
        { status: 400 }
      );
    }
    
    // 检查货物是否存在
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, body.shipmentId)
    });
    
    if (!shipment) {
      return NextResponse.json(
        { error: "货物不存在" },
        { status: 404 }
      );
    }
    
    // 检查该货物是否已有入库记录
    const existingRecord = await db.query.warehouseRecords.findFirst({
      where: and(
        eq(warehouseRecords.shipmentId, body.shipmentId),
        isNull(warehouseRecords.outboundDate)
      )
    });
    
    if (existingRecord) {
      return NextResponse.json(
        { error: "该货物已有未出库的记录" },
        { status: 400 }
      );
    }
    
    // 创建入库记录
    const inboundDate = body.inboundDate || new Date().toISOString();
    
    const recordData = {
      shipmentId: body.shipmentId,
      inboundDate,
      status: "in_warehouse",
      freeDays: body.freeDays || 7,
      standardRate: String(body.standardRate || "1.00"),
      extendedRate: String(body.extendedRate || "2.00"),
      standardDaysLimit: body.standardDaysLimit || 30,
    };
    
    const newRecord = await db.insert(warehouseRecords).values(recordData).returning();
    
    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse record:", error);
    return NextResponse.json(
      { error: "创建入库记录失败" },
      { status: 500 }
    );
  }
}

// PUT: 更新仓库记录（主要用于出库操作）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    const shipmentId = body.shipmentId;
    
    // 处理两种情况: 1) 通过ID更新特定记录 2) 通过shipmentId查找记录
    let record;
    
    if (id) {
      // 情况1: 通过ID查找记录
      record = await db.query.warehouseRecords.findFirst({
        where: eq(warehouseRecords.id, id)
      });
    } else if (shipmentId) {
      // 情况2: 通过shipmentId查找记录
      record = await db.query.warehouseRecords.findFirst({
        where: and(
          eq(warehouseRecords.shipmentId, shipmentId),
          isNull(warehouseRecords.outboundDate)
        )
      });
    } else {
      return NextResponse.json(
        { error: "缺少记录ID或货物ID" },
        { status: 400 }
      );
    }
    
    // 如果找不到记录但有shipmentId，自动创建一条新记录
    if (!record && shipmentId) {
      console.log(`找不到货物ID ${shipmentId} 的入库记录，自动创建一条`);
      
      // 获取货物信息
      const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.id, shipmentId)
      });
      
      if (!shipment) {
        return NextResponse.json(
          { error: "货物不存在" },
          { status: 404 }
        );
      }
      
      // 创建新入库记录
      const inboundDate = body.inboundDate || shipment.createdAt || new Date().toISOString();
      
      const newRecord = await db.insert(warehouseRecords).values({
        shipmentId,
        inboundDate,
        status: "in_warehouse",
        freeDays: 7, 
        standardRate: "1.00",
        extendedRate: "2.00",
        standardDaysLimit: 30,
      }).returning();
      
      if (newRecord.length === 0) {
        return NextResponse.json(
          { error: "创建入库记录失败" },
          { status: 500 }
        );
      }
      
      record = newRecord[0];
      console.log("自动创建的入库记录:", record);
    } else if (!record) {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }
    
    // 确保record存在后继续处理
    if (!record) {
      return NextResponse.json(
        { error: "记录处理错误" },
        { status: 500 }
      );
    }
    
    // 如果是出库操作
    const updateData: Record<string, any> = {};
    
    if (body.outboundDate) {
      updateData.outboundDate = body.outboundDate;
      updateData.status = "out_of_warehouse";
      
      // 计算存储天数
      const inboundDate = new Date(record.inboundDate);
      const outboundDate = new Date(body.outboundDate);
      const storageDays = Math.ceil((outboundDate.getTime() - inboundDate.getTime()) / (1000 * 60 * 60 * 24));
      updateData.storageDays = storageDays;
      
      // 计算仓储费用
      if (body.storageFee !== undefined) {
        updateData.storageFee = String(body.storageFee);
      } else if (record.storageFee === null) {
        // 默认费用计算
        const cbmValue = await getShipmentCBM(record.shipmentId);
        
        if (cbmValue) {
          const freeDays = record.freeDays;
          const standardRate = parseFloat(record.standardRate);
          const extendedRate = parseFloat(record.extendedRate);
          const standardDaysLimit = record.standardDaysLimit;
          
          let storageFee = 0;
          
          if (storageDays > freeDays) {
            // 标准费率阶段
            const standardDays = Math.min(storageDays - freeDays, standardDaysLimit - freeDays);
            storageFee += standardDays * standardRate * cbmValue;
            
            // 扩展费率阶段
            if (storageDays > standardDaysLimit) {
              const extendedDays = storageDays - standardDaysLimit;
              storageFee += extendedDays * extendedRate * cbmValue;
            }
          }
          
          updateData.storageFee = storageFee.toFixed(2);
        }
      }
    }
    
    // 更新其他字段
    if (body.status) updateData.status = body.status;
    if (body.freeDays !== undefined) updateData.freeDays = body.freeDays;
    if (body.standardRate !== undefined) updateData.standardRate = String(body.standardRate);
    if (body.extendedRate !== undefined) updateData.extendedRate = String(body.extendedRate);
    if (body.standardDaysLimit !== undefined) updateData.standardDaysLimit = body.standardDaysLimit;
    
    // 重要: 如果提供了入库日期，更新它
    if (body.inboundDate) {
      updateData.inboundDate = body.inboundDate;
      console.log("正在更新入库日期为:", body.inboundDate);
      
      // 同时更新存储天数 - 计算从新入库日期到当前日期（或出库日期）的天数
      const newInboundDate = new Date(body.inboundDate);
      const currentDate = record.outboundDate ? new Date(record.outboundDate) : new Date();
      if (!isNaN(newInboundDate.getTime())) {
        const storageDays = Math.ceil((currentDate.getTime() - newInboundDate.getTime()) / (1000 * 60 * 60 * 24));
        if (storageDays >= 0) {
          updateData.storageDays = storageDays;
          console.log("更新存储天数为:", storageDays);
        } else {
          console.warn("计算的存储天数为负值，使用1天作为默认值");
          updateData.storageDays = 1;
        }
      } else {
        console.error("入库日期格式无效:", body.inboundDate);
      }
    }
    
    // 只有当有数据要更新时才执行更新操作
    let updatedRecord;
    if (Object.keys(updateData).length > 0) {
      updatedRecord = await db.update(warehouseRecords)
        .set(updateData)
        .where(eq(warehouseRecords.id, record.id))
        .returning();
    } else {
      // 没有数据要更新，直接返回原记录
      console.log("没有提供任何更新数据");
      updatedRecord = [record];
    }
    
    // 如果是出库操作，同时更新货物状态
    if (body.outboundDate && record.shipmentId) {
      await db.update(shipments)
        .set({ 
          updatedAt: new Date().toISOString(),
          // 添加自定义字段来标记出库状态，可以根据实际需要调整
          route: body.route || "已出库" 
        })
        .where(eq(shipments.id, record.shipmentId));
    }
    
    return NextResponse.json(updatedRecord[0]);
  } catch (error) {
    console.error("Error updating warehouse record:", error);
    return NextResponse.json(
      { error: "更新仓库记录失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

// 辅助函数：获取货物的CBM值
async function getShipmentCBM(shipmentId: number): Promise<number | null> {
  try {
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId)
    });
    
    if (shipment && shipment.cbm) {
      return parseFloat(shipment.cbm);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting shipment CBM:", error);
    return null;
  }
} 