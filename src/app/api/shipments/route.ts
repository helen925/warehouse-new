import { db } from "@/server/db";
import { shipments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: 获取所有货物
export async function GET() {
  try {
    const allShipments = await db.query.shipments.findMany({
      orderBy: [shipments.createdAt]  // 按创建时间排序，确保新添加的货物也能显示
    });
    
    console.log(`获取到 ${allShipments.length} 个货物记录`);
    
    return NextResponse.json(allShipments);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "获取货物数据失败" },
      { status: 500 }
    );
  }
}

// POST: 创建新货物
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 生成唯一货物编号，如果没有提供
    const shipmentNumber = body.shipmentNumber || `S${Date.now()}`;
    
    // 转换数据类型适应数据库
    const shipmentData = {
      shipmentNumber,
      operationNumber: body.operationNumber,
      materialTypeCode: body.materialParam?.toString(),
      quantity: Number(body.quantity),
      actualWeight: String(body.actualWeight),
      length: String(body.length),
      width: String(body.width),
      height: String(body.height),
      materialWeight: String(body.materialWeight || "0"),
      perimeter: body.perimeter ? String(body.perimeter) : null,
      cbm: String(body.cbm),
      minWeightPerPiece: body.minWeightPerPiece ? String(body.minWeightPerPiece) : null,
      totalWeight: String(body.totalWeight),
      destination: body.destination,
      route: body.route || null,
      remarks: body.remarks || null
    };
    
    // 执行插入操作
    const newShipment = await db.insert(shipments).values(shipmentData).returning();
    
    return NextResponse.json(newShipment[0], { status: 201 });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { error: "创建货物失败" },
      { status: 500 }
    );
  }
}

// PUT: 更新货物信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少货物ID" },
        { status: 400 }
      );
    }
    
    // 更新数据
    delete body.id; // 移除ID字段，因为它不需要更新
    
    // 转换数据类型
    const updateData: Record<string, any> = {};
    
    if (body.operationNumber) updateData.operationNumber = body.operationNumber;
    if (body.materialTypeCode || body.materialParam) 
      updateData.materialTypeCode = body.materialTypeCode || body.materialParam?.toString();
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.actualWeight) updateData.actualWeight = String(body.actualWeight);
    if (body.length) updateData.length = String(body.length);
    if (body.width) updateData.width = String(body.width);
    if (body.height) updateData.height = String(body.height);
    if (body.materialWeight) updateData.materialWeight = String(body.materialWeight);
    if (body.perimeter) updateData.perimeter = String(body.perimeter);
    if (body.cbm) updateData.cbm = String(body.cbm);
    if (body.minWeightPerPiece) updateData.minWeightPerPiece = String(body.minWeightPerPiece);
    if (body.totalWeight) updateData.totalWeight = String(body.totalWeight);
    if (body.destination) updateData.destination = body.destination;
    if (body.route !== undefined) updateData.route = body.route;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    
    // 执行更新操作
    const updatedShipment = await db.update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();
    
    if (updatedShipment.length === 0) {
      return NextResponse.json(
        { error: "货物不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedShipment[0]);
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "更新货物失败" },
      { status: 500 }
    );
  }
}

// DELETE: 删除货物
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "缺少货物ID" },
      { status: 400 }
    );
  }
  
  try {
    // 执行删除操作
    const deletedShipment = await db.delete(shipments)
      .where(eq(shipments.id, parseInt(id)))
      .returning();
    
    if (deletedShipment.length === 0) {
      return NextResponse.json(
        { error: "货物不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "货物已成功删除" });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return NextResponse.json(
      { error: "删除货物失败" },
      { status: 500 }
    );
  }
} 