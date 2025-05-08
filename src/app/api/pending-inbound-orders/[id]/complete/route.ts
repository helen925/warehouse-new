import { db } from "@/server/db";
import { pendingInboundOrders, shipments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT: 完成入库操作，将待入库订单标记为已完成，并关联到实际入库的货物
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
    
    // 检查待入库订单是否存在
    const existingOrder = await db.query.pendingInboundOrders.findFirst({
      where: eq(pendingInboundOrders.id, id)
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "待入库订单不存在" },
        { status: 404 }
      );
    }
    
    // 如果订单已完成，返回错误
    if (existingOrder.completedAt) {
      return NextResponse.json(
        { error: "该订单已完成入库" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // 验证必要字段
    if (!body.shipmentId) {
      return NextResponse.json(
        { error: "缺少关联货物ID" },
        { status: 400 }
      );
    }
    
    // 检查关联的货物是否存在
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, body.shipmentId)
    });
    
    if (!shipment) {
      return NextResponse.json(
        { error: "关联的货物不存在" },
        { status: 404 }
      );
    }
    
    // 准备更新数据
    const updateData = {
      status: "已入库",
      completedAt: new Date().toISOString(),
      shipmentId: body.shipmentId,
      updatedAt: new Date().toISOString()
    };
    
    // 更新待入库订单
    const updatedOrder = await db.update(pendingInboundOrders)
      .set(updateData)
      .where(eq(pendingInboundOrders.id, id))
      .returning();
    
    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { error: "完成入库操作失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error completing pending inbound order:", error);
    return NextResponse.json(
      { error: "完成入库操作失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
} 