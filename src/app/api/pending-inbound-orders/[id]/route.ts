import { db } from "@/server/db";
import { pendingInboundOrders } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// 处理单个待入库订单的API路由
// GET: 获取单个待入库订单
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的ID格式" },
        { status: 400 }
      );
    }
    
    const order = await db.query.pendingInboundOrders.findFirst({
      where: eq(pendingInboundOrders.id, id)
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "待入库订单不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching pending inbound order:", error);
    return NextResponse.json(
      { error: "获取待入库订单失败" },
      { status: 500 }
    );
  }
}

// PUT: 更新待入库订单
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的ID格式" },
        { status: 400 }
      );
    }
    
    // 检查订单是否存在
    const existingOrder = await db.query.pendingInboundOrders.findFirst({
      where: eq(pendingInboundOrders.id, id)
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "待入库订单不存在" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // 准备更新数据
    const updateData: Record<string, any> = {};
    
    if (body.operationNumber !== undefined) updateData.operationNumber = body.operationNumber;
    if (body.expectedArrivalDate !== undefined) updateData.expectedArrivalDate = body.expectedArrivalDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt;
    if (body.shipmentId !== undefined) updateData.shipmentId = body.shipmentId;
    
    // 添加更新时间
    updateData.updatedAt = new Date().toISOString();
    
    const updatedOrder = await db.update(pendingInboundOrders)
      .set(updateData)
      .where(eq(pendingInboundOrders.id, id))
      .returning();
    
    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { error: "更新待入库订单失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error updating pending inbound order:", error);
    return NextResponse.json(
      { error: "更新待入库订单失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

// DELETE: 删除待入库订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的ID格式" },
        { status: 400 }
      );
    }
    
    // 检查订单是否存在
    const existingOrder = await db.query.pendingInboundOrders.findFirst({
      where: eq(pendingInboundOrders.id, id)
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "待入库订单不存在" },
        { status: 404 }
      );
    }
    
    // 删除订单
    const result = await db.delete(pendingInboundOrders)
      .where(eq(pendingInboundOrders.id, id))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "删除待入库订单失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pending inbound order:", error);
    return NextResponse.json(
      { error: "删除待入库订单失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
} 