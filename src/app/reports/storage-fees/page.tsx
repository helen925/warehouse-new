"use client";

import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";

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
  
  const start = new Date(inboundDate);
  const end = outboundDate ? new Date(outboundDate) : new Date(); // 如果没有出库日期，使用今天的日期
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

// 从localStorage中获取货物数据
const getStoredShipments = (): Shipment[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('shipments');
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

// 格式化数字为货币显示
const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} USD`;
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

interface ShipmentWithDetails extends Shipment {
  feeDetails: StorageFeeDetails;
}

export default function StorageFeesPage() {
  const [dateRange, setDateRange] = useState<string>("30");
  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [operationColors, setOperationColors] = useState<Record<string, string>>({});

  // 获取和处理货物数据
  useEffect(() => {
    const storedShipments = getStoredShipments();
    
    if (storedShipments.length > 0) {
      // 为每个货物计算或获取仓储费用
      let total = 0;
      
      const processedShipments = storedShipments.map(shipment => {
        const updatedShipment = { ...shipment } as ShipmentWithDetails;
        
        // 获取存储天数 - 已出库使用记录的天数，未出库计算到今天
        let storageDays = 0;
        if (updatedShipment.status === '已出库' && updatedShipment.storageDays) {
          storageDays = updatedShipment.storageDays;
        } else {
          storageDays = calculateStorageDays(updatedShipment.inboundDate, updatedShipment.outboundDate);
          updatedShipment.storageDays = storageDays;
        }
        
        // 计算仓储费用
        const cbmValue = parseFloat(updatedShipment.cbm.toString() || "0");
        
        if (!isNaN(cbmValue)) {
          // 已出库的货物使用记录的费用
          let fee: StorageFeeDetails;
          
          if (updatedShipment.status === '已出库' && updatedShipment.storageFee) {
            const feeValue = parseFloat(updatedShipment.storageFee.toString());
            fee = calculateStorageFee(cbmValue, storageDays);
            // 使用记录的总费用，但保留详细计算
            fee.totalFee = feeValue;
          } else {
            fee = calculateStorageFee(cbmValue, storageDays);
            updatedShipment.storageFee = fee.totalFee.toFixed(2);
          }
          
          updatedShipment.feeDetails = fee;
          total += fee.totalFee;
        }
        
        return updatedShipment;
      });
      
      // 应用日期范围筛选
      const filteredShipments = filterShipmentsByDateRange(processedShipments, dateRange);
      
      // 重新计算筛选后的总费用
      if (filteredShipments.length !== processedShipments.length) {
        total = filteredShipments.reduce((sum, shipment) => 
          sum + shipment.feeDetails.totalFee, 0);
      }
      
      // 为不同的操作单号分配交替的颜色
      const colors: Record<string, string> = {};
      const operations = [...new Set(filteredShipments.map(s => s.operationNumber))];
      operations.forEach((op, index) => {
        colors[op] = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      });
      
      setOperationColors(colors);
      setShipments(filteredShipments);
      setTotalFee(total);
    }
  }, [dateRange]);

  // 处理日期范围变化
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  // 处理查看详情
  const handleViewDetails = (shipmentId: string) => {
    setSelectedShipment(selectedShipment === shipmentId ? null : shipmentId);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">仓储费用报表</h1>
        <p className="mt-2 text-gray-600">查看和计算所有在库货物的仓储费用</p>
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
            {shipments.map((shipment, index) => {
              const shipmentId = `${shipment.operationNumber}-${shipment.inboundDate}`;
              const isDetailOpen = selectedShipment === shipmentId;
              const rowColor = operationColors[shipment.operationNumber] || 'bg-white';
              
              return (
                <Fragment key={index}>
                  <tr className={`hover:bg-gray-100 ${rowColor}`}>
                    <td className="px-6 py-4 font-medium">{shipment.operationNumber}</td>
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
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="rounded-md bg-white p-3 shadow-sm">
                          <h4 className="mb-2 font-medium">费用计算明细 (基于入库日期: {formatDateDisplay(shipment.inboundDate)}):</h4>
                          <ul className="ml-4 list-disc space-y-1 text-sm">
                            <li>0-7天: {shipment.feeDetails.freeDays}天 × 0 USD/CBM/天 × {shipment.cbm} CBM = {formatCurrency(shipment.feeDetails.freeDaysFee)} (免费期)</li>
                            <li>8-30天: {shipment.feeDetails.standardDays}天 × 1 USD/CBM/天 × {shipment.cbm} CBM = {formatCurrency(shipment.feeDetails.standardDaysFee)}</li>
                            <li>31+天: {shipment.feeDetails.extendedDays}天 × 2 USD/CBM/天 × {shipment.cbm} CBM = {formatCurrency(shipment.feeDetails.extendedDaysFee)}</li>
                            <li className="font-semibold">总计: {formatCurrency(shipment.feeDetails.totalFee)}</li>
                          </ul>
                          {shipment.status !== '已出库' && (
                            <div className="mt-2 text-sm text-blue-600">
                              <p>注意: 此货物尚未出库，费用计算截止到今天。</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-purple-50">
            <tr>
              <th scope="row" colSpan={5} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                总计
              </th>
              <td className="px-6 py-3 text-sm font-semibold text-gray-900">{formatCurrency(totalFee)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
} 