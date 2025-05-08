// 待入库订单API客户端库

import type { PendingInboundOrder } from "@/server/db/schema";

// 获取所有待入库订单
export async function getAllPendingInboundOrders(forceRefresh = false): Promise<PendingInboundOrder[]> {
  try {
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : "";
    const response = await fetch(`/api/pending-inbound-orders${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error(`获取待入库订单失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("获取待入库订单错误:", error);
    return [];
  }
}

// 按状态筛选待入库订单
export async function getPendingInboundOrdersByStatus(status: string): Promise<PendingInboundOrder[]> {
  try {
    const response = await fetch(`/api/pending-inbound-orders?status=${status}`);
    
    if (!response.ok) {
      throw new Error(`获取待入库订单失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`获取${status}状态的待入库订单错误:`, error);
    return [];
  }
}

// 获取单个待入库订单
export async function getPendingInboundOrder(id: number): Promise<PendingInboundOrder | null> {
  try {
    const response = await fetch(`/api/pending-inbound-orders/${id}`);
    
    if (!response.ok) {
      throw new Error(`获取待入库订单失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("获取待入库订单详情错误:", error);
    return null;
  }
}

// 创建新的待入库订单
export async function createPendingInboundOrder(
  orderData: Omit<PendingInboundOrder, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<PendingInboundOrder | null> {
  try {
    const response = await fetch('/api/pending-inbound-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      throw new Error(`创建待入库订单失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("创建待入库订单错误:", error);
    return null;
  }
}

// 更新待入库订单
export async function updatePendingInboundOrder(
  id: number,
  orderData: Partial<PendingInboundOrder>
): Promise<PendingInboundOrder | null> {
  try {
    const response = await fetch(`/api/pending-inbound-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      throw new Error(`更新待入库订单失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("更新待入库订单错误:", error);
    return null;
  }
}

// 删除待入库订单
export async function deletePendingInboundOrder(id: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/pending-inbound-orders/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`删除待入库订单失败: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("删除待入库订单错误:", error);
    return false;
  }
}

// 完成入库（将待入库订单标记为已完成并关联到实际入库的货物）
export async function completePendingInboundOrder(
  id: number, 
  shipmentId: number
): Promise<PendingInboundOrder | null> {
  try {
    const response = await fetch(`/api/pending-inbound-orders/${id}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        shipmentId,
        completedAt: new Date().toISOString(),
        status: "已入库"
      }),
    });
    
    if (!response.ok) {
      throw new Error(`完成入库操作失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("完成入库操作错误:", error);
    return null;
  }
} 