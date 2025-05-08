"use client";

import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { getAllShipments } from "@/lib/api/shipments";
import type { Shipment as APIShipment } from "@/lib/api/shipments";
import { getAllWarehouseRecords } from "@/lib/api/warehouse-records";
import type { WarehouseRecord } from "@/lib/api/warehouse-records";

// 定义货物接口
interface Shipment {
  operationNumber: string;
  materialParam: string | number;
  quantity: string | number;
  actualWeight: string | number;
  length: string | number;
  width: string | number;
  height: string | number;
  materialWeight: string | number;
  cbm: string | number;
  totalWeight: string | number;
  totalShippingWeight?: string | number;
  destination: string;
  remarks?: string;
  status?: string;
  inboundDate?: string;
  outboundDate?: string;
  storageDays?: number;
  storageFee?: string | number;
  id?: number; // 添加id字段以支持API数据
}

// 定义存储费用详情接口
interface StorageFeeDetails {
  freeDays: number;
  standardDays: number;
  extendedDays: number;
  freeDaysFee: number;
  standardDaysFee: number;
  extendedDaysFee: number;
  totalFee: number;
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

// 计算存储天数
const calculateStorageDays = (inboundDate: string | undefined, outboundDate: string | undefined): number => {
  if (!inboundDate) return 0;
  
  // 调试信息
  console.log("计算天数 - 入库日期:", inboundDate);
  console.log("计算天数 - 出库/当前日期:", outboundDate || new Date().toISOString());
  
  // 处理PostgreSQL日期格式 (可能包含毫秒和时区信息)
  let start: Date;
  if (inboundDate && inboundDate.includes(' ')) {
    // 处理格式如 "2025-04-01 00:00:00.000000"
    const parts = inboundDate.split(' ')[0];
    if (parts) {
      const dateParts = parts.split('-');
      if (dateParts.length >= 3) {
        start = new Date(
          parseInt(dateParts[0] || "0"), // 年
          parseInt(dateParts[1] || "0") - 1, // 月 (JS月份从0开始)
          parseInt(dateParts[2] || "1") // 日
        );
      } else {
        // 如果分割失败，回退到标准解析
        start = new Date(inboundDate);
      }
    } else {
      // 如果分割失败，回退到标准解析
      start = new Date(inboundDate);
    }
  } else {
    // 标准ISO格式如 "2025-04-01T00:00:00.000Z"
    start = new Date(inboundDate);
  }
  
  let end: Date;
  if (outboundDate) {
    if (outboundDate.includes(' ')) {
      // 处理格式如 "2025-05-08 00:00:00.000000"
      const parts = outboundDate.split(' ')[0];
      if (parts) {
        const dateParts = parts.split('-');
        if (dateParts.length >= 3) {
          end = new Date(
            parseInt(dateParts[0] || "0"), // 年
            parseInt(dateParts[1] || "0") - 1, // 月 (JS月份从0开始)
            parseInt(dateParts[2] || "1") // 日
          );
        } else {
          // 如果分割失败，回退到标准解析
          end = new Date(outboundDate);
        }
      } else {
        // 如果分割失败，回退到标准解析
        end = new Date(outboundDate);
      }
    } else {
      // 标准ISO格式
      end = new Date(outboundDate);
    }
  } else {
    // 使用当前日期
    end = new Date();
  }
  
  // 确保日期有效
  if (isNaN(start.getTime())) {
    console.error("无效的入库日期:", inboundDate);
    return 0;
  }
  
  if (isNaN(end.getTime())) {
    console.error("无效的出库日期:", outboundDate);
    // 如果出库日期无效但入库日期有效，使用当前日期
    end = new Date();
  }
  
  // 调试日期转换结果
  console.log("解析后 - 入库日期:", start.toISOString());
  console.log("解析后 - 出库/当前日期:", end.toISOString());
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log("计算的天数:", days);
  return days;
};

// 计算仓储费用
const calculateStorageFee = (cbm: number, days: number): StorageFeeDetails => {
  const freeDaysLimit = 7;
  const standardDaysLimit = 30;
  const standardRate = 1; // USD/CBM/天
  const extendedRate = 2; // USD/CBM/天
  
  // 计算各个阶段的天数
  const freeDays = Math.min(days, freeDaysLimit);
  const standardDays = days > freeDaysLimit 
    ? Math.min(days - freeDaysLimit, standardDaysLimit - freeDaysLimit)
    : 0;
  const extendedDays = days > standardDaysLimit
    ? days - standardDaysLimit
    : 0;
  
  // 计算各阶段费用
  const freeDaysFee = 0; // 免费期
  const standardDaysFee = standardDays * standardRate * cbm;
  const extendedDaysFee = extendedDays * extendedRate * cbm;
  
  // 总费用
  const totalFee = freeDaysFee + standardDaysFee + extendedDaysFee;
  
  return {
    freeDays,
    standardDays,
    extendedDays,
    freeDaysFee,
    standardDaysFee,
    extendedDaysFee,
    totalFee
  };
};

// 从API获取货物和仓库记录数据
const fetchStorageData = async (): Promise<{shipments: APIShipment[], warehouseRecords: WarehouseRecord[]}> => {
  try {
    // 强制刷新确保获取最新数据
    const [shipments, warehouseRecords] = await Promise.all([
      getAllShipments(true),
      getAllWarehouseRecords()
    ]);
    
    console.log(`获取到 ${shipments.length} 个货物和 ${warehouseRecords.length} 条仓库记录`);
    
    return { shipments, warehouseRecords };
  } catch (error) {
    console.error("获取数据失败:", error);
    return { shipments: [], warehouseRecords: [] };
  }
};

// 替换原来的getStoredShipments函数，现在从API获取
const getApiShipments = async (): Promise<ShipmentWithDetails[]> => {
  const { shipments, warehouseRecords } = await fetchStorageData();
  
  // 整合仓库记录到货物数据中
  return shipments.map(shipment => {
    // 查找货物对应的仓库记录
    const record = warehouseRecords.find(r => r.shipmentId === shipment.id);
    
    // 计算入库天数
    const storageDays = record 
      ? (record.storageDays || calculateStorageDays(record.inboundDate, record.outboundDate))
      : calculateStorageDays(shipment.createdAt, shipment.updatedAt);
    
    // 计算CBM值
    const cbmValue = parseFloat(shipment.cbm);
    
    // 计算费用详情
    const feeDetails = calculateStorageFee(cbmValue, storageDays);
    
    // 如果已经出库并有记录的费用，则使用记录的费用
    let storageFee = feeDetails.totalFee.toFixed(2);
    if (record && record.storageFee) {
      const recordFee = parseFloat(record.storageFee);
      if (!isNaN(recordFee) && recordFee > 0) {
        storageFee = recordFee.toFixed(2);
      }
    }
    
    // 构建ShipmentWithDetails对象
    return {
      operationNumber: shipment.operationNumber,
      materialParam: shipment.materialTypeCode || "6000", // 使用materialTypeCode作为材料参数
      quantity: shipment.quantity,
      actualWeight: shipment.actualWeight,
      length: shipment.length,
      width: shipment.width,
      height: shipment.height,
      materialWeight: shipment.materialWeight || "0",
      cbm: shipment.cbm,
      totalWeight: shipment.totalWeight,
      destination: shipment.destination || "",
      remarks: shipment.remarks,
      status: shipment.route === "已出库" ? "已出库" : "在库",
      inboundDate: record ? record.inboundDate : shipment.createdAt,
      outboundDate: record ? record.outboundDate : (shipment.route === "已出库" ? shipment.updatedAt : undefined),
      storageDays,
      storageFee,
      feeDetails,
      id: shipment.id
    } as ShipmentWithDetails;
  });
};

// 格式化数字为货币显示
const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} USD`;
};

// 提取基础单号（去除子单号后缀）
const getBaseOperationNumber = (operationNumber: string): string => {
  // 匹配基本格式：字母+数字，可能后跟-数字
  const match = operationNumber.match(/^([A-Za-z]+\d+)(?:-\d+)?$/);
  return match && match[1] ? match[1] : operationNumber;
};

// 检查两个货物是否属于同一组（相同基础单号，相同入库日期，相同出库日期）
const isSameShipmentGroup = (a: Shipment, b: Shipment): boolean => {
  const aBaseOp = getBaseOperationNumber(a.operationNumber);
  const bBaseOp = getBaseOperationNumber(b.operationNumber);
  
  // 基础单号必须相同
  if (aBaseOp !== bBaseOp) return false;
  
  // 入库日期必须相同
  if (a.inboundDate !== b.inboundDate) return false;
  
  // 如果都已出库，出库日期也必须相同
  if (a.status === '已出库' && b.status === '已出库') {
    return a.outboundDate === b.outboundDate;
  }
  
  // 如果一个已出库一个在库，不是同组
  if (a.status !== b.status) return false;
  
  // 其他情况（都在库）视为同组
  return true;
};

// 处理日期范围筛选
const filterShipmentsByDateRange = (shipments: ShipmentWithDetails[], days: number | string): ShipmentWithDetails[] => {
  if (days === 'all') return shipments;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(days));
  const cutoffDateString = cutoffDate.toISOString().split('T')[0] || '';
  
  return shipments.filter(shipment => {
    if (!shipment.inboundDate) return false;
    return shipment.inboundDate >= cutoffDateString;
  });
};

// 合并同组货物为一条记录
const mergeShipmentGroups = (shipments: ShipmentWithDetails[]): ShipmentWithDetails[] => {
  if (shipments.length <= 1) return shipments;
  
  // 按基础单号和日期分组
  const groupMap: Map<string, ShipmentWithDetails[]> = new Map();
  
  shipments.forEach(shipment => {
    const baseOp = getBaseOperationNumber(shipment.operationNumber);
    // 创建分组键：基础单号 + 入库日期 + 出库日期（或状态）
    const groupKey = `${baseOp}|${shipment.inboundDate || ''}|${shipment.status === '已出库' ? (shipment.outboundDate || '') : 'in'}`;
    
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    
    // 确保存在再推入
    const group = groupMap.get(groupKey);
    if (group) {
      group.push(shipment);
    }
  });
  
  // 合并每个组内的货物
  const mergedShipments: ShipmentWithDetails[] = [];
  
  groupMap.forEach(group => {
    if (group.length === 1 && group[0]) {
      // 如果组内只有一个货物，直接添加（确保不是undefined）
      mergedShipments.push(group[0]);
    } else if (group.length > 1) {
      // 确保组内有货物再进行合并
      const firstShipment = group[0];
      if (firstShipment) {
        const baseOp = getBaseOperationNumber(firstShipment.operationNumber);
        
        // 使用安全的reduce函数计算总和 - 避免使用泛型语法
        const safeReduce = function(items: any[], callback: (acc: number, item: any) => number, initialValue: number): number {
          return items.reduce((sum, item) => {
            if (item === undefined || item === null) return sum;
            return callback(sum, item);
          }, initialValue);
        };
        
        // 创建合并后的货物记录（确保类型安全）
        const mergedShipment: ShipmentWithDetails = {
          ...firstShipment,
          operationNumber: `${baseOp}(${group.length}个子单)`, // 显示为基础单号(N个子单)
          quantity: safeReduce(group, (sum, s) => sum + parseFloat(s.quantity.toString() || "0"), 0),
          cbm: safeReduce(group, (sum, s) => sum + parseFloat(s.cbm.toString() || "0"), 0).toFixed(4),
          // 使用第一个货物的其他属性
          feeDetails: {
            ...firstShipment.feeDetails,
            // 重新计算合并后的费用
            freeDaysFee: safeReduce(group, (sum, s) => sum + (s.feeDetails?.freeDaysFee || 0), 0),
            standardDaysFee: safeReduce(group, (sum, s) => sum + (s.feeDetails?.standardDaysFee || 0), 0),
            extendedDaysFee: safeReduce(group, (sum, s) => sum + (s.feeDetails?.extendedDaysFee || 0), 0),
            totalFee: safeReduce(group, (sum, s) => sum + (s.feeDetails?.totalFee || 0), 0)
          }
        };
        
        // 更新合并后的仓储费用
        mergedShipment.storageFee = mergedShipment.feeDetails.totalFee.toFixed(2);
        
        mergedShipments.push(mergedShipment);
      }
    }
  });
  
  // 按操作单号排序
  return mergedShipments.sort((a, b) => {
    const aBaseOp = getBaseOperationNumber(a.operationNumber);
    const bBaseOp = getBaseOperationNumber(b.operationNumber);
    return aBaseOp.localeCompare(bBaseOp) || a.operationNumber.localeCompare(b.operationNumber);
  });
};

interface ShipmentWithDetails extends Shipment {
  feeDetails: StorageFeeDetails;
}

export default function StorageFeesPage() {
  const [dateRange, setDateRange] = useState<string>("30");
  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [operationColors, setOperationColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // 获取和处理货物数据
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        // 获取API数据
        const processedShipments = await getApiShipments();
        
        if (!isMounted) return;
        
        // 应用日期范围筛选
        const filteredShipments = filterShipmentsByDateRange(processedShipments, dateRange);
        
        // 合并同组货物
        const mergedShipments = mergeShipmentGroups(filteredShipments);
        
        // 重新计算筛选后的总费用
        const total = mergedShipments.reduce((sum, shipment) => 
          sum + parseFloat(shipment.storageFee?.toString() || "0"), 0);
        
        // 为不同的操作单号分配交替的颜色
        const colors: Record<string, string> = {};
        const operations = [...new Set(mergedShipments.map(s => getBaseOperationNumber(s.operationNumber)))];
        operations.forEach((op, index) => {
          colors[op] = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        });
        
        if (isMounted) {
          setOperationColors(colors);
          setShipments(mergedShipments);
          setTotalFee(total);
          setLoading(false);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error("加载数据失败:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // 立即加载数据
    loadData();
    
    // 设置定时刷新 (每60秒刷新一次)
    const interval = setInterval(loadData, 60000);
    setRefreshInterval(interval);
    
    return () => {
      isMounted = false;
      // 清理定时器
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dateRange]);

  // 处理日期范围变化
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  // 处理查看详情
  const handleViewDetails = (shipmentId: string) => {
    setSelectedShipment(selectedShipment === shipmentId ? null : shipmentId);
  };

  // 处理手动刷新
  const handleRefresh = () => {
    // 找到并清除当前的刷新定时器
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    // 触发useEffect重新执行
    setDateRange(prev => prev);
  };

  if (loading && shipments.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">仓储费用报表</h1>
          <p className="mt-2 text-gray-600">查看和计算所有在库货物的仓储费用</p>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">加载数据中，请稍候...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">仓储费用报表</h1>
        <p className="mt-2 text-gray-600">查看和计算所有在库货物的仓储费用</p>
        {lastUpdated && (
          <p className="mt-1 text-xs text-gray-500">
            最后更新: {lastUpdated} {loading && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>}
          </p>
        )}
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">仓储费计算规则</h2>
          <div className="mt-2 sm:mt-0">
            <span className="mr-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
              0-7天: 免费
            </span>
            <span className="mr-2 inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              8-30天: 1 USD/CBM/天
            </span>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">
              30天以上: 2 USD/CBM/天
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">费用将按照阶梯式计算，超过30天的部分按照2 USD/CBM/天计算。</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 flex items-center sm:mb-0">
          <label htmlFor="date-range" className="mr-2 block text-sm font-medium text-gray-700">
            日期范围:
          </label>
          <select
            id="date-range"
            name="date-range"
            className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            value={dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
            <option value="180">最近180天</option>
            <option value="365">最近1年</option>
            <option value="all">全部</option>
          </select>
          
          <button
            type="button"
            onClick={handleRefresh}
            className="ml-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            导出Excel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
                clipRule="evenodd"
              />
            </svg>
            打印报表
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-purple-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                操作单号
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                材料参数
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                入库日期
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                已存储天数
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                体积 (CBM)
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                当前仓储费用
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                费用明细
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {shipments.length > 0 ? (
              shipments.map((shipment, index) => {
                const shipmentId = `${shipment.operationNumber}-${shipment.inboundDate}`;
                const isDetailOpen = selectedShipment === shipmentId;
                const baseOpNumber = getBaseOperationNumber(shipment.operationNumber);
                const rowColor = operationColors[baseOpNumber] || 'bg-white';
                
                return (
                  <Fragment key={index}>
                    <tr className={`hover:bg-gray-100 ${rowColor}`}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex">
                          {shipment.operationNumber !== baseOpNumber && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 mt-1.5"></span>
                          )}
                          {shipment.operationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">{shipment.materialParam}</td>
                      <td className="px-6 py-4 font-semibold">{formatDateDisplay(shipment.inboundDate)}</td>
                      <td className="px-6 py-4">{shipment.storageDays} 天</td>
                      <td className="px-6 py-4">{shipment.cbm}</td>
                      <td className={`px-6 py-4 font-medium ${parseFloat(shipment.storageFee?.toString() || "0") > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(parseFloat(shipment.storageFee?.toString() || "0"))}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          className="text-purple-600 hover:text-purple-900 hover:underline"
                          onClick={() => handleViewDetails(shipmentId)}
                        >
                          {isDetailOpen ? "隐藏详情" : "查看详情"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${shipment.status === '已出库' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${shipment.status === '已出库' ? 'bg-yellow-600' : 'bg-green-600'}`}></span>
                          {shipment.status || '在库'}
                        </span>
                      </td>
                    </tr>
                    {isDetailOpen && (
                      <tr className={rowColor}>
                        <td colSpan={8} className="px-6 py-4">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h4 className="mb-2 font-medium">费用明细</h4>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <p className="text-xs text-gray-500">免费期 (0-7天)</p>
                                <p className="font-medium">{shipment.feeDetails.freeDays} 天</p>
                                <p className="text-green-600">{formatCurrency(shipment.feeDetails.freeDaysFee)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">标准期 (8-30天)</p>
                                <p className="font-medium">{shipment.feeDetails.standardDays} 天</p>
                                <p className="text-amber-600">{formatCurrency(shipment.feeDetails.standardDaysFee)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">延长期 (30天以上)</p>
                                <p className="font-medium">{shipment.feeDetails.extendedDays} 天</p>
                                <p className="text-red-600">{formatCurrency(shipment.feeDetails.extendedDaysFee)}</p>
                              </div>
                            </div>
                            <div className="mt-4 text-right">
                              <p className="font-semibold">总费用: <span className="text-red-600">{formatCurrency(shipment.feeDetails.totalFee)}</span></p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-solid border-purple-500 border-t-transparent"></div>
                      <span className="ml-2">加载数据中...</span>
                    </div>
                  ) : (
                    <p>没有找到货物记录</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={5} className="px-6 py-4 text-right font-medium">总计：</td>
              <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(totalFee)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
} 