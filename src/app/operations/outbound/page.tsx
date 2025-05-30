"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Shipment } from "@/lib/api/shipments";
import { getAllShipments } from "@/lib/api/shipments";
import { outboundShipment, calculateStorageFee, calculateStorageDays, getWarehouseRecordsByShipmentId } from "@/lib/api/warehouse-records";

// 格式化日期为 YYYY-MM-DD 格式
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取今天的日期，格式为 YYYY-MM-DD
const today = formatDate(new Date());

// 格式化货币
const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} USD`;
};

export default function OutboundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shipmentIdParam = searchParams.get('shipmentId');
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [outboundDate, setOutboundDate] = useState<string>(today);
  const [storageDays, setStorageDays] = useState<number>(0);
  const [storageFee, setStorageFee] = useState<number>(0);
  const [processingState, setProcessingState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [processMessage, setProcessMessage] = useState<string>("");
  
  // 获取货物数据
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const data = await getAllShipments();
        
        // 过滤出未出库的货物
        const inStockShipments = data.filter(shipment => 
          shipment.route !== "已出库" && shipment.route !== "out_of_warehouse"
        );
        
        setShipments(inStockShipments);
        
        // 如果URL中有shipmentId参数，选中对应货物
        if (shipmentIdParam) {
          const shipmentId = shipmentIdParam;
          setSelectedShipmentId(shipmentId);
          
          const selected = inStockShipments.find(s => s.id.toString() === shipmentId);
          if (selected) {
            setSelectedShipment(selected);
            
            // 计算存储天数和费用
            const inboundDate = selected.createdAt;
            const days = calculateStorageDays(inboundDate, outboundDate);
            setStorageDays(days);
            
            // 计算费用
            const cbm = parseFloat(selected.cbm);
            if (!isNaN(cbm)) {
              const fee = calculateStorageFee(cbm, days);
              setStorageFee(fee);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch shipments:", err);
        setError("获取货物数据失败");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShipments();
  }, [shipmentIdParam]);
  
  // 处理货物选择
  const handleShipmentSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    setSelectedShipmentId(id);
    
    if (id) {
      const selected = shipments.find(s => s.id.toString() === id);
      if (selected) {
        setSelectedShipment(selected);
        
        // 重新计算存储天数和费用
        const inboundDate = selected.createdAt;
        const days = calculateStorageDays(inboundDate, outboundDate);
        setStorageDays(days);
        
        // 计算费用
        const cbm = parseFloat(selected.cbm);
        if (!isNaN(cbm)) {
          const fee = calculateStorageFee(cbm, days);
          setStorageFee(fee);
        }
      } else {
        setSelectedShipment(null);
        setStorageDays(0);
        setStorageFee(0);
      }
    } else {
      setSelectedShipment(null);
      setStorageDays(0);
      setStorageFee(0);
    }
  };
  
  // 处理出库日期变更
  const handleOutboundDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setOutboundDate(newDate);
    
    if (selectedShipment) {
      // 重新计算存储天数和费用
      const inboundDate = selectedShipment.createdAt;
      const days = calculateStorageDays(inboundDate, newDate);
      setStorageDays(days);
      
      // 计算费用
      const cbm = parseFloat(selectedShipment.cbm);
      if (!isNaN(cbm)) {
        const fee = calculateStorageFee(cbm, days);
        setStorageFee(fee);
      }
    }
  };
  
  // 处理出库提交
  const handleSubmitOutbound = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedShipment) {
      setError("请选择要出库的货物");
      return;
    }
    
    try {
      setProcessingState("processing");
      setProcessMessage("正在处理出库操作...");
      
      // 直接使用shipmentId执行出库操作，更可靠的方法
      await outboundShipment(selectedShipment.id, outboundDate, storageFee, true);
      
      setProcessingState("success");
      setProcessMessage("出库成功！");
      
      // 3秒后跳转到货物列表页
      setTimeout(() => {
        router.push('/shipments');
      }, 3000);
    } catch (err) {
      console.error("出库操作失败:", err);
      setProcessingState("error");
      setProcessMessage(`出库操作失败: ${err instanceof Error ? err.message : '请稍后重试'}`);
      
      // 5秒后重置状态
      setTimeout(() => {
        setProcessingState("idle");
        setProcessMessage("");
      }, 5000);
    }
  };
  
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">货物出库</h1>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">货物出库</h1>
          <p className="mt-2 text-red-600">{error}</p>
          <Link href="/shipments" className="mt-4 inline-block text-blue-600 hover:underline">
            返回货物列表
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">货物出库</h1>
        <p className="mt-2 text-gray-600">选择需要出库的货物并计算仓储费用</p>
      </div>
      
      {processingState !== "idle" && (
        <div className={`mb-6 rounded-lg border p-4 ${
          processingState === "processing" ? "bg-blue-50 border-blue-200" :
          processingState === "success" ? "bg-green-50 border-green-200" :
          "bg-red-50 border-red-200"
        }`}>
          <p className={`${
            processingState === "processing" ? "text-blue-700" :
            processingState === "success" ? "text-green-700" :
            "text-red-700"
          }`}>
            {processMessage}
          </p>
        </div>
      )}
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmitOutbound}>
          <div className="mb-4">
            <label htmlFor="shipmentId" className="mb-1 block text-sm font-medium text-gray-700">
              选择货物
            </label>
            <select
              id="shipmentId"
              name="shipmentId"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              value={selectedShipmentId}
              onChange={handleShipmentSelect}
              required
            >
              <option value="">-- 请选择货物 --</option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.operationNumber} - {shipment.destination} - CBM: {shipment.cbm}
                </option>
              ))}
            </select>
          </div>
          
          {selectedShipment && (
            <>
              <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-2 text-lg font-medium">货物信息</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">操作单号</p>
                    <p className="font-medium">{selectedShipment.operationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">入库日期</p>
                    <p className="font-medium">
                      {new Date(selectedShipment.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">目的地</p>
                    <p className="font-medium">{selectedShipment.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">体积 (CBM)</p>
                    <p className="font-medium">{selectedShipment.cbm}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">实重 (kg)</p>
                    <p className="font-medium">{selectedShipment.actualWeight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">计费重</p>
                    <p className="font-medium">{selectedShipment.totalWeight}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="outboundDate" className="mb-1 block text-sm font-medium text-gray-700">
                  出库日期
                </label>
                <input
                  type="date"
                  id="outboundDate"
                  name="outboundDate"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  value={outboundDate}
                  onChange={handleOutboundDateChange}
                  min={selectedShipment.createdAt.split('T')[0]}
                  max={today}
                  required
                />
              </div>
              
              <div className="mb-6 rounded-lg border bg-yellow-50 p-4">
                <h3 className="mb-2 text-lg font-medium">费用计算</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">存储天数</p>
                    <p className="text-xl font-semibold">{storageDays} 天</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">体积 (CBM)</p>
                    <p className="text-xl font-semibold">{selectedShipment.cbm}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">仓储费用</p>
                    <p className="text-xl font-semibold text-red-600">
                      {formatCurrency(storageFee)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="mb-1 text-sm font-medium">费用明细:</h4>
                  <ul className="ml-4 list-disc text-sm">
                    <li>
                      0-7天: 免费
                    </li>
                    <li>
                      8-30天: 1 USD/CBM/天
                    </li>
                    <li>
                      30天以上: 2 USD/CBM/天
                    </li>
                  </ul>
                </div>
              </div>
            </>
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
              className={`rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                !selectedShipment || processingState === "processing" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!selectedShipment || processingState === "processing"}
            >
              确认出库
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 