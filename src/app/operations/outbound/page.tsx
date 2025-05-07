"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 定义货物接口，使所有字段可选，避免类型错误
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

// 计算存储天数
const calculateStorageDays = (inboundDate: string | undefined, outboundDate: string): number => {
  if (!inboundDate) return 0;
  const start = new Date(inboundDate);
  const end = new Date(outboundDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 计算仓储费用
const calculateStorageFee = (cbm: number, days: number): { 
  freeDaysFee: number; 
  standardDaysFee: number; 
  extendedDaysFee: number; 
  totalFee: number;
  freeDays: number;
  standardDays: number;
  extendedDays: number;
} => {
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
    freeDaysFee,
    standardDaysFee,
    extendedDaysFee,
    totalFee,
    freeDays,
    standardDays,
    extendedDays
  };
};

// 格式化日期为YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 获取今天的日期
const today = formatDate(new Date());

export default function OutboundOperationPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [outboundDate, setOutboundDate] = useState<string>(today);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [storageDays, setStorageDays] = useState<number>(0);
  const [storageFee, setStorageFee] = useState<{
    freeDaysFee: number;
    standardDaysFee: number;
    extendedDaysFee: number;
    totalFee: number;
    freeDays: number;
    standardDays: number;
    extendedDays: number;
  } | null>(null);

  // 从localStorage获取货物数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedShipments = localStorage.getItem('shipments');
      if (storedShipments) {
        // 只获取状态为"在库"的货物
        const inStockShipments = JSON.parse(storedShipments).filter(
          (shipment: Shipment) => shipment.status !== '已出库'
        );
        setShipments(inStockShipments);
      }
    }
  }, []);

  // 当选择货物或出库日期变化时，重新计算费用
  useEffect(() => {
    if (selectedShipmentId && outboundDate) {
      const shipment = shipments[parseInt(selectedShipmentId)];
      if (shipment) {
        setSelectedShipment(shipment);
        
        const days = calculateStorageDays(shipment.inboundDate, outboundDate);
        setStorageDays(days);
        
        const cbmValue = parseFloat(shipment.cbm.toString());
        if (!isNaN(cbmValue)) {
          const fee = calculateStorageFee(cbmValue, days);
          setStorageFee(fee);
        }
      }
    } else {
      setSelectedShipment(null);
      setStorageDays(0);
      setStorageFee(null);
    }
  }, [selectedShipmentId, outboundDate, shipments]);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShipmentId || !selectedShipment) {
      alert("请选择要出库的货物");
      return;
    }
    
    // 更新货物状态为"已出库"
    const updatedShipments = [...shipments];
    const index = parseInt(selectedShipmentId);
    
    // 使用类型断言解决TypeScript类型错误
    updatedShipments[index] = {
      ...updatedShipments[index],
      status: '已出库',
      outboundDate: outboundDate,
      storageDays: storageDays,
      storageFee: storageFee?.totalFee.toFixed(2)
    } as Shipment;
    
    // 保存回localStorage
    const allShipments = localStorage.getItem('shipments') 
      ? JSON.parse(localStorage.getItem('shipments') || '[]')
      : [];
      
    // 找到所有货物中的索引并更新
    const allIndex = allShipments.findIndex((s: Shipment) => 
      s.operationNumber === selectedShipment.operationNumber && 
      s.inboundDate === selectedShipment.inboundDate
    );
    
    if (allIndex !== -1) {
      // 使用类型断言解决TypeScript类型错误
      allShipments[allIndex] = {
        ...allShipments[allIndex],
        status: '已出库',
        outboundDate: outboundDate,
        storageDays: storageDays,
        storageFee: storageFee?.totalFee.toFixed(2)
      } as Shipment;
      
      localStorage.setItem('shipments', JSON.stringify(allShipments));
      
      // 重定向到货物管理页面
      alert("出库操作成功完成！");
      router.push('/shipments');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">出库操作</h1>
        <p className="mt-2 text-gray-600">记录货物出库信息</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-1">
              <label htmlFor="shipmentId" className="block text-sm font-medium text-gray-700">
                选择操作单号
              </label>
              <select
                id="shipmentId"
                name="shipmentId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={selectedShipmentId}
                onChange={(e) => setSelectedShipmentId(e.target.value)}
                required
              >
                <option value="">请选择操作单号</option>
                {shipments.map((shipment, index) => (
                  <option key={index} value={index.toString()}>
                    操作单号: {shipment.operationNumber} | 目的地: {shipment.destination} | 入库日期: {shipment.inboundDate || '未知'}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label htmlFor="outboundDate" className="block text-sm font-medium text-gray-700">
                出库日期
              </label>
              <input
                type="date"
                name="outboundDate"
                id="outboundDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={outboundDate}
                onChange={(e) => setOutboundDate(e.target.value)}
                min={selectedShipment?.inboundDate || ""}
                max={today}
                required
              />
            </div>

            <div className="col-span-2">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">出库时将自动计算仓储费用：</p>
                    <ul className="ml-5 list-inside list-disc text-sm text-blue-700">
                      <li>7天内免费存储</li>
                      <li>7-30天: 1 USD/CBM/天</li>
                      <li>30天以上: 2 USD/CBM/天</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedShipment && storageFee && (
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="text-lg font-medium text-gray-900">货物信息和费用预览</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">操作单号</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedShipment.operationNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">材料参数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedShipment.materialParam}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">体积 (CBM)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedShipment.cbm}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">入库日期</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedShipment.inboundDate || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">存储天数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{storageDays} 天</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">仓储费用</dt>
                  <dd className="mt-1 text-sm font-medium text-red-600">{storageFee.totalFee.toFixed(2)} USD</dd>
                </div>
              </dl>
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">费用明细：</span>
                  <ul className="ml-5 mt-1 list-inside list-disc text-sm text-gray-600">
                    <li>0-7天: {storageFee.freeDays}天 × 0 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.freeDaysFee.toFixed(2)} USD (免费期)</li>
                    <li>8-30天: {storageFee.standardDays}天 × 1 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.standardDaysFee.toFixed(2)} USD</li>
                    <li>31+天: {storageFee.extendedDays}天 × 2 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.extendedDaysFee.toFixed(2)} USD</li>
                    <li>总计: {storageFee.totalFee.toFixed(2)} USD</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Link
              href="/shipments"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              取消
            </Link>
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              disabled={!selectedShipment}
            >
              确认出库
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 