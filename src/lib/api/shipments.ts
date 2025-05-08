/**
 * 货物管理API客户端服务
 */

export interface Shipment {
  id: number;
  shipmentNumber: string;
  operationNumber: string;
  materialTypeCode?: string;
  quantity: number;
  actualWeight: string;
  length: string;
  width: string;
  height: string;
  materialWeight?: string;
  perimeter?: string;
  cbm: string;
  minWeightPerPiece?: string;
  totalWeight: string;
  destination?: string;
  route?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ShipmentInput {
  shipmentNumber?: string;
  operationNumber: string;
  materialParam?: string | number;
  quantity: string | number;
  actualWeight: string | number;
  length: string | number;
  width: string | number;
  height: string | number;
  materialWeight?: string | number;
  cbm: string | number;
  totalWeight: string | number;
  destination: string;
  remarks?: string;
  route?: string;
}

/**
 * 获取所有货物列表
 */
export async function getAllShipments(forceRefresh: boolean = false): Promise<Shipment[]> {
  try {
    // 构建请求URL，添加时间戳以避免缓存
    const url = forceRefresh 
      ? `/api/shipments?t=${Date.now()}`
      : '/api/shipments';
      
    const response = await fetch(url, {
      cache: forceRefresh ? 'no-store' : 'default',
    });
    
    if (!response.ok) {
      throw new Error(`获取货物列表失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API返回 ${data.length} 条货物记录`);
    return data;
  } catch (error) {
    console.error("Error fetching shipments:", error);
    // 如果API失败，尝试从localStorage获取
    return getShipmentsFromLocalStorage();
  }
}

/**
 * 从localStorage获取货物列表（兼容原有实现）
 */
function getShipmentsFromLocalStorage(): Shipment[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('shipments');
    if (!stored) return [];
    
    // 转换原始结构到Shipment类型
    const parsedData = JSON.parse(stored);
    return parsedData.map((item: any, index: number) => ({
      id: index + 1, // 模拟ID
      shipmentNumber: `S${Date.now() + index}`, // 生成唯一标识
      operationNumber: item.operationNumber,
      materialTypeCode: item.materialParam?.toString(),
      quantity: Number(item.quantity),
      actualWeight: item.actualWeight?.toString(),
      length: item.length?.toString(),
      width: item.width?.toString(),
      height: item.height?.toString(),
      materialWeight: item.materialWeight?.toString(),
      cbm: item.cbm?.toString(),
      totalWeight: item.totalWeight?.toString(),
      destination: item.destination,
      route: item.status === '已出库' ? '已出库' : item.route,
      remarks: item.remarks,
      createdAt: item.inboundDate || new Date().toISOString(),
      updatedAt: item.outboundDate || undefined
    }));
  } catch (error) {
    console.error("Error getting shipments from localStorage:", error);
    return [];
  }
}

/**
 * 创建新货物
 */
export async function createShipment(shipmentData: ShipmentInput): Promise<Shipment> {
  try {
    const response = await fetch('/api/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });
    
    if (!response.ok) {
      throw new Error(`创建货物失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating shipment:", error);
    
    // 如果API失败，尝试保存到localStorage
    return saveShipmentToLocalStorage(shipmentData);
  }
}

/**
 * 保存货物到localStorage（兼容原有实现）
 */
function saveShipmentToLocalStorage(shipmentData: ShipmentInput): Shipment {
  if (typeof window === 'undefined') 
    throw new Error("Cannot access localStorage");
  
  try {
    // 获取现有货物
    const existingShipments = localStorage.getItem('shipments') 
      ? JSON.parse(localStorage.getItem('shipments') || '[]') 
      : [];
    
    // 添加新货物
    const newShipment = {
      ...shipmentData,
      inboundDate: new Date().toISOString(),
      status: '在库'
    };
    
    existingShipments.push(newShipment);
    
    // 保存回localStorage
    localStorage.setItem('shipments', JSON.stringify(existingShipments));
    
    // 返回模拟的Shipment对象
    return {
      id: existingShipments.length,
      shipmentNumber: `S${Date.now()}`,
      operationNumber: shipmentData.operationNumber,
      materialTypeCode: shipmentData.materialParam?.toString(),
      quantity: Number(shipmentData.quantity),
      actualWeight: shipmentData.actualWeight?.toString(),
      length: shipmentData.length?.toString(),
      width: shipmentData.width?.toString(),
      height: shipmentData.height?.toString(),
      materialWeight: shipmentData.materialWeight?.toString(),
      cbm: shipmentData.cbm?.toString(),
      totalWeight: shipmentData.totalWeight?.toString(),
      destination: shipmentData.destination,
      remarks: shipmentData.remarks,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error saving shipment to localStorage:", error);
    throw new Error("保存货物失败");
  }
}

/**
 * 更新货物
 */
export async function updateShipment(id: number, shipmentData: Partial<ShipmentInput>): Promise<Shipment> {
  try {
    const response = await fetch('/api/shipments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...shipmentData }),
    });
    
    if (!response.ok) {
      throw new Error(`更新货物失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating shipment:", error);
    throw new Error("更新货物失败");
  }
}

/**
 * 删除货物
 */
export async function deleteShipment(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/shipments?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`删除货物失败: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting shipment:", error);
    throw new Error("删除货物失败");
  }
}

/**
 * 获取单个货物详情
 */
export async function getShipmentById(id: number): Promise<Shipment | null> {
  try {
    // 获取所有货物，然后找到指定ID的那个
    // 由于我们目前没有单货物查询API，我们先从所有货物中查找
    const shipments = await getAllShipments(true);
    return shipments.find(shipment => shipment.id === id) || null;
  } catch (error) {
    console.error(`Error fetching shipment with ID ${id}:`, error);
    throw new Error("获取货物详情失败");
  }
} 