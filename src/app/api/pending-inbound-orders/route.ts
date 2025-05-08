import { db } from "@/server/db";
import { pendingInboundOrders } from "@/server/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: 获取所有待入库订单，可选按状态筛选
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    
    let conditions = {};
    
    // 如果指定了状态，添加筛选条件
    if (status) {
      conditions = { status: status };
    }
    
    // 查询并获取结果
    const orders = await db.query.pendingInboundOrders.findMany({
      where: status ? eq(pendingInboundOrders.status, status) : undefined,
      orderBy: [
        asc(pendingInboundOrders.expectedArrivalDate),
        asc(pendingInboundOrders.createdAt)
      ],
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching pending inbound orders:", error);
    return NextResponse.json(
      { error: "获取待入库订单失败" },
      { status: 500 }
    );
  }
}

// POST: 创建新的待入库订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.operationNumber) {
      return NextResponse.json(
        { error: "缺少操作单号" },
        { status: 400 }
      );
    }
    
    if (!body.expectedArrivalDate) {
      return NextResponse.json(
        { error: "缺少预计到仓日期" },
        { status: 400 }
      );
    }
    
    // 验证日期格式
    let expectedDate;
    try {
      expectedDate = new Date(body.expectedArrivalDate);
      if (isNaN(expectedDate.getTime())) {
        return NextResponse.json(
          { error: "预计到仓日期格式无效" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "预计到仓日期格式无效", details: error instanceof Error ? error.message : "未知错误" },
        { status: 400 }
      );
    }
    
    // 准备数据
    const orderData = {
      operationNumber: body.operationNumber,
      expectedArrivalDate: body.expectedArrivalDate, // 使用原始ISO格式字符串
      status: body.status || "待提货", // 默认状态：待提货
      quantity: body.quantity || 1,
      description: body.description || null,
      contactPerson: body.contactPerson || null,
      contactPhone: body.contactPhone || null,
      remarks: body.remarks || null
    };
    
    console.log("准备创建新订单:", orderData);
    
    // 创建新订单
    const newOrder = await db.insert(pendingInboundOrders).values(orderData).returning();
    
    if (newOrder.length === 0) {
      return NextResponse.json(
        { error: "创建待入库订单失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error("Error creating pending inbound order:", error);
    return NextResponse.json(
      { 
        error: "创建待入库订单失败", 
        details: error instanceof Error ? error.message : "未知错误",
        stack: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
} 