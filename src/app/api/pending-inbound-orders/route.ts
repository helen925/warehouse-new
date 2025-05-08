import { db } from "@/server/db";
import { pendingInboundOrders } from "@/server/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

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
    console.log("接收到的请求数据:", body);
    
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
    
    try {
      // 直接使用SQL插入语句
      const result = await db.execute(sql`
        INSERT INTO "仓库系统_pending_inbound_order" 
        (operation_number, expected_arrival_date, status, quantity, description, contact_person, contact_phone, remarks)
        VALUES 
        (
          ${body.operationNumber}, 
          ${body.expectedArrivalDate}, 
          ${body.status || "待提货"}, 
          ${body.quantity || 1},
          ${body.description || null},
          ${body.contactPerson || null},
          ${body.contactPhone || null},
          ${body.remarks || null}
        )
        RETURNING id, operation_number, expected_arrival_date, status, quantity, description, contact_person, contact_phone, remarks
      `);
      
      console.log("SQL执行结果:", result);
      
      // 检查结果
      if (result && result.rows && result.rows.length > 0) {
        return NextResponse.json(result.rows[0], { status: 201 });
      } else {
        return NextResponse.json(
          { error: "创建待入库订单失败，数据库未返回结果" },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error("数据库操作失败:", dbError);
      return NextResponse.json(
        { 
          error: "数据库操作失败", 
          details: dbError instanceof Error ? dbError.message : "未知错误",
          sql_error: true
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("创建待入库订单过程中发生错误:", error);
    return NextResponse.json(
      { 
        error: "创建待入库订单失败", 
        message: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    );
  }
} 