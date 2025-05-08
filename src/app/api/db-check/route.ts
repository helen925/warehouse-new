import { db } from "@/server/db";
import { pendingInboundOrders } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

// GET: 检查数据库连接和结构
export async function GET(request: NextRequest) {
  try {
    console.log("开始检查数据库连接...");
    
    // 检查pendingInboundOrders表结构
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pending_inbound_order'
    `);
    
    // 测试插入操作
    const testInsert = await db.insert(pendingInboundOrders).values({
      operationNumber: "TEST001",
      expectedArrivalDate: new Date().toISOString(),
      status: "待提货",
      quantity: 1,
      description: "测试数据"
    }).returning();
    
    // 测试查询操作
    const testQuery = await db.select().from(pendingInboundOrders).limit(5);
    
    // 返回结果
    return NextResponse.json({
      status: "成功",
      message: "数据库连接正常",
      tableInfo,
      testInsert,
      recentRecords: testQuery
    });
  } catch (error) {
    console.error("数据库检查失败:", error);
    return NextResponse.json(
      { 
        status: "失败",
        error: "数据库检查失败", 
        details: error instanceof Error ? error.message : "未知错误",
        stack: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
} 