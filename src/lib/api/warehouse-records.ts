/**
 * 仓库记录API客户端服务
 */

export interface WarehouseRecord {
  id: number;
  shipmentId: number;
  inboundDate: string;
  outboundDate?: string;
  status: string;
  storageDays?: number;
  storageFee?: string;
  freeDays: number;
  standardRate: string;
  extendedRate: string;
  standardDaysLimit: number;
  createdAt: string;
  updatedAt?: string;
  shipment?: any;  // 关联的货物信息
}

export interface WarehouseRecordInput {
  shipmentId: number;
  inboundDate?: string;
  outboundDate?: string;
  status?: string;
  storageDays?: number;
  storageFee?: string | number;
  freeDays?: number;
  standardRate?: string | number;
  extendedRate?: string | number;
  standardDaysLimit?: number;
}

/**
 * 获取所有仓库记录
 */
export async function getAllWarehouseRecords(): Promise<WarehouseRecord[]> {
  try {
    const response = await fetch('/api/warehouse-records');
    
    if (!response.ok) {
      throw new Error(`获取仓库记录失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching warehouse records:", error);
    return [];
  }
}

/**
 * 根据货物ID获取仓库记录
 */
export async function getWarehouseRecordsByShipmentId(shipmentId: number): Promise<WarehouseRecord[]> {
  try {
    const response = await fetch(`/api/warehouse-records?shipmentId=${shipmentId}`);
    
    if (!response.ok) {
      throw new Error(`获取货物的仓库记录失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching warehouse records for shipment ${shipmentId}:`, error);
    return [];
  }
}

/**
 * 创建入库记录
 */
export async function createWarehouseRecord(recordData: WarehouseRecordInput): Promise<WarehouseRecord> {
  try {
    const response = await fetch('/api/warehouse-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    if (!response.ok) {
      throw new Error(`创建入库记录失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating warehouse record:", error);
    throw new Error("创建入库记录失败");
  }
}

/**
 * 更新仓库记录（主要用于出库操作）
 */
export async function updateWarehouseRecord(
  id: number, 
  recordData: Partial<WarehouseRecordInput>
): Promise<WarehouseRecord> {
  try {
    const response = await fetch('/api/warehouse-records', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...recordData }),
    });
    
    if (!response.ok) {
      throw new Error(`更新仓库记录失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating warehouse record:", error);
    throw new Error("更新仓库记录失败");
  }
}

/**
 * 执行货物出库
 */
export async function outboundShipment(
  recordOrShipmentId: number,
  outboundDate: string = new Date().toISOString(),
  storageFee?: number,
  isShipmentId: boolean = false
): Promise<WarehouseRecord> {
  try {
    // 如果传入的是shipmentId而不是recordId
    if (isShipmentId) {
      return await updateWarehouseRecord(0, {
        shipmentId: recordOrShipmentId,
        outboundDate,
        status: 'out_of_warehouse',
        storageFee: storageFee?.toString()
      });
    }
    
    // 否则使用recordId更新
    return await updateWarehouseRecord(recordOrShipmentId, {
      outboundDate,
      status: 'out_of_warehouse',
      storageFee: storageFee?.toString()
    });
  } catch (error) {
    console.error("Error outbounding shipment:", error);
    throw new Error("出库操作失败");
  }
}

/**
 * 计算货物的存储天数
 */
export function calculateStorageDays(inboundDate: string, outboundDate?: string): number {
  const startDate = new Date(inboundDate);
  const endDate = outboundDate ? new Date(outboundDate) : new Date();
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 计算货物的仓储费用
 */
export function calculateStorageFee(
  cbm: number,
  days: number,
  freeDays: number = 7,
  standardRate: number = 1,
  extendedRate: number = 2,
  standardDaysLimit: number = 30
): number {
  // 免费期
  if (days <= freeDays) {
    return 0;
  }
  
  let fee = 0;
  
  // 标准费率阶段 (7-30天)
  const standardDays = Math.min(days - freeDays, standardDaysLimit - freeDays);
  if (standardDays > 0) {
    fee += standardDays * standardRate * cbm;
  }
  
  // 延长费率阶段 (30天以上)
  const extendedDays = Math.max(0, days - standardDaysLimit);
  if (extendedDays > 0) {
    fee += extendedDays * extendedRate * cbm;
  }
  
  return fee;
} 