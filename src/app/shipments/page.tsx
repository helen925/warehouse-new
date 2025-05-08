"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Shipment } from "@/lib/api/shipments";
import { getAllShipments } from "@/lib/api/shipments";

// 定义汇总数据接口
interface ShipmentSummary {
  operationNumber: string;
  totalQuantity: number;
  totalActualWeight: number;
  totalCBM: number;
  totalShippingWeight: number;
  destination: string;
  inStockCount: number;
  outStockCount: number;
}

// 格式化日期显示
const formatDateDisplay = (dateString?: string): string => {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// 提取基础单号（去除子单号后缀）
const getBaseOperationNumber = (operationNumber: string): string => {
  // 匹配基本格式：字母+数字，可能后跟-数字
  const match = operationNumber.match(/^([A-Za-z]+\d+)(?:-\d+)?$/);
  return match && match[1] ? match[1] : operationNumber;
};

// 按操作单号汇总货物数据
const summarizeShipmentsByOperationNumber = (shipments: Shipment[]): ShipmentSummary[] => {
  // 使用Map按操作单号分组
  const summaryMap = new Map<string, ShipmentSummary>();
  
  shipments.forEach(shipment => {
    const baseOperationNumber = getBaseOperationNumber(shipment.operationNumber);
    const quantity = shipment.quantity;
    const actualWeight = parseFloat(shipment.actualWeight || "0");
    const cbm = parseFloat(shipment.cbm || "0");
    const totalWeight = parseFloat(shipment.totalWeight || "0");
    const shippingWeight = totalWeight * quantity; // 计算总计费重
    const isInStock = shipment.route !== '已出库';
    
    if (summaryMap.has(baseOperationNumber)) {
      // 更新现有汇总数据
      const summary = summaryMap.get(baseOperationNumber)!;
      summary.totalQuantity += quantity;
      summary.totalActualWeight += actualWeight;
      summary.totalCBM += cbm * quantity; // CBM乘以数量
      summary.totalShippingWeight += shippingWeight;
      
      if (isInStock) {
        summary.inStockCount += 1;
      } else {
        summary.outStockCount += 1;
      }
    } else {
      // 创建新的汇总数据
      summaryMap.set(baseOperationNumber, {
        operationNumber: baseOperationNumber,
        totalQuantity: quantity,
        totalActualWeight: actualWeight,
        totalCBM: cbm * quantity, // CBM乘以数量
        totalShippingWeight: shippingWeight,
        destination: shipment.destination || "",
        inStockCount: isInStock ? 1 : 0,
        outStockCount: isInStock ? 0 : 1
      });
    }
  });
  
  // 转换Map为数组并按操作单号排序
  return Array.from(summaryMap.values())
    .sort((a, b) => a.operationNumber.localeCompare(b.operationNumber));
};

// 对货物数据进行排序：先按基础操作单号排序，再按出库日期排序，最后按状态排序
const sortShipments = (shipments: Shipment[]): Shipment[] => {
  return [...shipments].sort((a, b) => {
    // 首先按基础操作单号排序
    const aBaseOp = getBaseOperationNumber(a.operationNumber);
    const bBaseOp = getBaseOperationNumber(b.operationNumber);
    const baseOpCompare = aBaseOp.localeCompare(bBaseOp);
    
    if (baseOpCompare !== 0) {
      return baseOpCompare;
    }
    
    // 再按具体子单号排序
    const opCompare = a.operationNumber.localeCompare(b.operationNumber);
    if (opCompare !== 0) {
      return opCompare;
    }
    
    // 操作单号相同时，按出库日期排序（若有）
    const aOutDate = a.updatedAt || "";
    const bOutDate = b.updatedAt || "";
    const outDateCompare = aOutDate.localeCompare(bOutDate);
    if (outDateCompare !== 0) {
      return outDateCompare;
    }

    // 出库日期相同时，按状态排序（在库的排在前面）
    const aStatus = a.route === "已出库" ? "已出库" : "在库";
    const bStatus = b.route === "已出库" ? "已出库" : "在库";
    // 已出库排在后面，在库排在前面
    if (aStatus === "已出库" && bStatus !== "已出库") {
      return 1;
    }
    if (aStatus !== "已出库" && bStatus === "已出库") {
      return -1;
    }
    
    // 如果状态也相同，则按入库日期排序
    const aDate = a.createdAt || "";
    const bDate = b.createdAt || "";
    return aDate.localeCompare(bDate);
  });
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [summaries, setSummaries] = useState<ShipmentSummary[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取货物数据
    const fetchShipments = async () => {
      try {
        setLoading(true);
        // 使用强制刷新选项，避免缓存问题
        const shipmentData = await getAllShipments(true);
        
        // 获取仓库记录
        const warehouseResponse = await fetch(`/api/warehouse-records`);
        const warehouseRecords = await warehouseResponse.json();
        
        // 将仓库记录映射到货物ID
        const recordsByShipmentId = new Map();
        warehouseRecords.forEach((record: any) => {
          recordsByShipmentId.set(record.shipmentId, record);
        });
        
        // 将仓库记录的入库日期合并到货物数据中
        const enhancedShipments = shipmentData.map((shipment: any) => {
          const record = recordsByShipmentId.get(shipment.id);
          return {
            ...shipment,
            // 如果有仓库记录，使用其入库日期，否则使用创建日期
            createdAt: record ? record.inboundDate : shipment.createdAt
          };
        });
        
        // 直接使用所有货物数据，不进行状态筛选
        console.log(`从API获取到 ${enhancedShipments.length} 个货物记录`);
        
        if (enhancedShipments.length > 0) {
          // 排序处理货物数据
          const sortedShipments = sortShipments(enhancedShipments);
          setShipments(sortedShipments);
          
          // 计算汇总数据
          const shipmentSummaries = summarizeShipmentsByOperationNumber(sortedShipments);
          setSummaries(shipmentSummaries);
          
          // 为相同基础单号的行分配背景颜色
          const colors: Record<string, string> = {};
          const baseNumbers = [...new Set(sortedShipments.map(s => getBaseOperationNumber(s.operationNumber)))];
          
          // 交替分配背景色
          baseNumbers.forEach((baseNum, index) => {
            colors[baseNum] = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
          });
          
          setGroupColors(colors);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch shipments:", err);
        setError("获取货物数据失败");
        setLoading(false);
      }
    };
    
    fetchShipments();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">货物管理</h1>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">货物管理</h1>
            <p className="mt-2 text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">货物管理</h1>
          <div className="mt-2">
            <button 
              onClick={() => setShowSummary(!showSummary)}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {showSummary ? "查看明细数据" : "查看操作单号汇总"}
            </button>
          </div>
        </div>
        <Link
          href="/shipments/new"
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          添加新货物
        </Link>
      </div>

      {showSummary ? (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">操作单号汇总</h2>
          <div className="overflow-x-auto rounded-lg border mb-8">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 font-medium text-gray-900">操作单号</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">总件数</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">总实重(kg)</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">总方数(CBM)</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">总计费重</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">目的地</th>
                  <th className="border px-3 py-2 font-medium text-gray-900">在库/已出库</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {summaries.map((summary, index) => (
                  <tr 
                    className={`hover:bg-gray-100 ${groupColors[summary.operationNumber] || ''}`} 
                    key={index}
                  >
                    <td className="border px-3 py-2 font-medium">{summary.operationNumber}</td>
                    <td className="border px-3 py-2">{summary.totalQuantity}</td>
                    <td className="border px-3 py-2">{summary.totalActualWeight.toFixed(3)}</td>
                    <td className="border px-3 py-2">{summary.totalCBM.toFixed(4)}</td>
                    <td className="border px-3 py-2">{summary.totalShippingWeight.toFixed(3)}</td>
                    <td className="border px-3 py-2">{summary.destination}</td>
                    <td className="border px-3 py-2">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 text-xs font-medium rounded-full">
                        {summary.inStockCount} / {summary.outStockCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 font-medium text-gray-900">操作单号</th>
                <th className="border px-3 py-2 font-medium text-gray-900">材料参数</th>
                <th className="border px-3 py-2 font-medium text-gray-900">件数</th>
                <th className="border px-3 py-2 font-medium text-gray-900">实重(kg)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">长(cm)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">宽(cm)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">高(cm)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">材重(kg)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">单件方数(CBM)</th>
                <th className="border px-3 py-2 font-medium text-gray-900">单件计费重</th>
                <th className="border px-3 py-2 font-medium text-gray-900">目的地</th>
                <th className="border px-3 py-2 font-medium text-gray-900">入库日期</th>
                <th className="border px-3 py-2 font-medium text-gray-900">状态</th>
                <th className="border px-3 py-2 font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {shipments.map((shipment) => {
                const baseOpNumber = getBaseOperationNumber(shipment.operationNumber);
                const rowColor = groupColors[baseOpNumber] || '';
                return (
                  <tr key={shipment.id} className={`hover:bg-gray-100 ${rowColor}`}>
                    <td className="border px-3 py-2 font-medium">
                      <div className="flex">
                        {shipment.operationNumber !== baseOpNumber && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 mt-1.5"></span>
                        )}
                        {shipment.operationNumber}
                      </div>
                    </td>
                    <td className="border px-3 py-2">{shipment.materialTypeCode}</td>
                    <td className="border px-3 py-2">{shipment.quantity}</td>
                    <td className="border px-3 py-2">{shipment.actualWeight}</td>
                    <td className="border px-3 py-2">{shipment.length}</td>
                    <td className="border px-3 py-2">{shipment.width}</td>
                    <td className="border px-3 py-2">{shipment.height}</td>
                    <td className="border px-3 py-2">{shipment.materialWeight}</td>
                    <td className="border px-3 py-2">{shipment.cbm}</td>
                    <td className="border px-3 py-2">{shipment.totalWeight}</td>
                    <td className="border px-3 py-2">{shipment.destination}</td>
                    <td className="border px-3 py-2">{formatDateDisplay(shipment.createdAt)}</td>
                    <td className="border px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${shipment.route === '已出库' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${shipment.route === '已出库' ? 'bg-yellow-600' : 'bg-green-600'}`}></span>
                        {shipment.route === '已出库' ? '已出库' : '在库'}
                      </span>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/shipments/${shipment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          详情
                        </Link>
                        {shipment.route !== '已出库' && (
                          <Link
                            href={`/operations/outbound?shipmentId=${shipment.id}`}
                            className="text-green-600 hover:underline"
                          >
                            出库
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
} 