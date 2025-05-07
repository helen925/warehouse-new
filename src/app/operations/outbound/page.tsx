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
  const isoString = date.toISOString();
  const parts = isoString.split('T');
  return parts[0] || '';
};

// 获取今天的日期
const today = formatDate(new Date());

// 提取基础单号（去除子单号后缀）
const getBaseOperationNumber = (operationNumber: string): string => {
  // 匹配基本格式：字母+数字，可能后跟-数字
  const match = operationNumber.match(/^([A-Za-z]+\d+)(?:-\d+)?$/);
  return match && match[1] ? match[1] : operationNumber;
};

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
  const [enableBatchOutbound, setEnableBatchOutbound] = useState<boolean>(false);
  const [relatedShipments, setRelatedShipments] = useState<Shipment[]>([]);
  const [batchSelections, setBatchSelections] = useState<Record<number, boolean>>({});

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

  // 获取URL参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shipmentId = urlParams.get('shipmentId');
    if (shipmentId) {
      setSelectedShipmentId((parseInt(shipmentId) - 1).toString()); // 调整索引
    }
  }, []);

  // 当选择货物时，查找相关的同单号货物
  useEffect(() => {
    if (selectedShipmentId && shipments.length > 0) {
      const index = parseInt(selectedShipmentId);
      const shipment = shipments[index];
      if (shipment) {
        setSelectedShipment(shipment);
        
        // 查找同一基础单号且同一天入库的其他货物
        const baseOpNumber = getBaseOperationNumber(shipment.operationNumber);
        const inboundDateStr = typeof shipment.inboundDate === 'string' ? shipment.inboundDate : '';
        const sameGroupShipments = shipments.filter((s, idx) => {
          const isSameGroup = s !== shipment && 
            getBaseOperationNumber(s.operationNumber) === baseOpNumber && 
            (s.inboundDate || '') === inboundDateStr;
          
          // 如果是同组，初始化为选中状态
          if (isSameGroup) {
            setBatchSelections(prev => ({...prev, [idx]: true}));
          }
          
          return isSameGroup;
        });
        
        setRelatedShipments(sameGroupShipments);
        
        // 计算当前选择货物的费用
        const days = calculateStorageDays(inboundDateStr, outboundDate);
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
      setRelatedShipments([]);
      setBatchSelections({});
    }
  }, [selectedShipmentId, outboundDate, shipments]);

  // 切换单个相关货物的选择状态
  const toggleShipmentSelection = (index: number) => {
    setBatchSelections(prev => ({...prev, [index]: !prev[index]}));
  };

  // 切换所有相关货物的选择状态
  const toggleAllSelections = () => {
    const allSelected = relatedShipments.every((_, index) => 
      batchSelections[shipments.indexOf(_)] === true
    );
    
    const newSelections = {...batchSelections};
    relatedShipments.forEach((s, i) => {
      const index = shipments.indexOf(s);
      newSelections[index] = !allSelected;
    });
    
    setBatchSelections(newSelections);
  };

  // 获取当前选中的相关货物
  const getSelectedRelatedShipments = (): Shipment[] => {
    return relatedShipments.filter((s, i) => 
      batchSelections[shipments.indexOf(s)] === true
    );
  };

  // 计算批量出库费用
  const calculateBatchFee = (): {
    totalCBM: number;
    fee: {
      freeDaysFee: number;
      standardDaysFee: number;
      extendedDaysFee: number;
      totalFee: number;
      freeDays: number;
      standardDays: number;
      extendedDays: number;
    };
  } | null => {
    if (!selectedShipment || !storageFee) return null;
    
    // 获取选中的相关货物
    const selectedRelatedShipments = getSelectedRelatedShipments();
    
    // 计算所有相关货物的总CBM
    const allShipments = [selectedShipment, ...selectedRelatedShipments];
    const totalCBM = allShipments.reduce((sum, s) => {
      const cbm = parseFloat(s.cbm.toString() || "0");
      return sum + (isNaN(cbm) ? 0 : cbm);
    }, 0);
    
    // 使用总CBM计算费用
    const days = calculateStorageDays(selectedShipment.inboundDate, outboundDate);
    const fee = calculateStorageFee(totalCBM, days);
    
    return { totalCBM, fee };
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShipmentId || !selectedShipment) {
      alert("请选择要出库的货物");
      return;
    }
    
    // 获取所有需要出库的货物（选中的主货物和相关货物）
    const selectedRelatedShipments = getSelectedRelatedShipments();
    const outboundShipments = enableBatchOutbound 
      ? [selectedShipment, ...selectedRelatedShipments] 
      : [selectedShipment];
    
    // 计算费用（批量或单个）
    const batchFee = enableBatchOutbound ? calculateBatchFee() : null;
    
    // 保存回localStorage
    const allShipments = localStorage.getItem('shipments') 
      ? JSON.parse(localStorage.getItem('shipments') || '[]')
      : [];
    
    // 为每个要出库的货物更新状态
    let updated = false;
    outboundShipments.forEach(shipment => {
      // 找到所有货物中的索引并更新
      const allIndex = allShipments.findIndex((s: Shipment) => 
        s.operationNumber === shipment.operationNumber && 
        s.inboundDate === shipment.inboundDate
      );
      
      if (allIndex !== -1) {
        // 更新货物状态
        allShipments[allIndex] = {
          ...allShipments[allIndex],
          status: '已出库',
          outboundDate: outboundDate,
          storageDays: storageDays
        } as Shipment;
        
        // 设置仓储费用
        if (enableBatchOutbound && batchFee) {
          // 批量出库：按比例分配总费用
          const shipmentCBM = parseFloat(shipment.cbm.toString() || "0");
          const proportion = shipmentCBM / batchFee.totalCBM;
          allShipments[allIndex].storageFee = (batchFee.fee.totalFee * proportion).toFixed(2);
        } else {
          // 单个出库：使用当前计算的费用
          allShipments[allIndex].storageFee = storageFee?.totalFee.toFixed(2);
        }
        
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem('shipments', JSON.stringify(allShipments));
      
      // 提示消息并重定向
      if (enableBatchOutbound) {
        alert(`已成功出库 ${outboundShipments.length} 个货物！`);
      } else {
        alert("出库操作成功完成！");
      }
      
      router.push('/shipments');
    }
  };

  // 计算批量出库的费用预览
  const batchFeePreview = enableBatchOutbound ? calculateBatchFee() : null;
  const selectedRelatedShipments = getSelectedRelatedShipments();

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
                {shipments.map((shipment, index) => {
                  const baseOpNumber = getBaseOperationNumber(shipment.operationNumber);
                  return (
                    <option key={index} value={index.toString()}>
                      操作单号: {shipment.operationNumber} {baseOpNumber !== shipment.operationNumber ? `(基础单号: ${baseOpNumber})` : ''} | 目的地: {shipment.destination} | 入库日期: {shipment.inboundDate || '未知'}
                    </option>
                  );
                })}
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

            {relatedShipments.length > 0 && (
              <div className="col-span-2">
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">发现相关子单号货物</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>系统检测到 {relatedShipments.length} 个与当前选择货物相同基础单号且同一天入库的货物。</p>
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={enableBatchOutbound}
                              onChange={() => setEnableBatchOutbound(!enableBatchOutbound)}
                            />
                            <span className="ml-2 text-yellow-800 font-medium">批量出库（合并计算仓储费用）</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {enableBatchOutbound && (
                    <div className="mt-3 bg-white p-3 rounded-md border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700">选择要批量出库的子单号</h4>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={relatedShipments.every((_, i) => batchSelections[shipments.indexOf(_)] === true)}
                            onChange={toggleAllSelections}
                          />
                          <span className="ml-2 text-gray-700 text-sm">全选/取消全选</span>
                        </label>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {relatedShipments.map((related, idx) => {
                          const shipmentIndex = shipments.indexOf(related);
                          return (
                            <li key={idx} className="py-2 flex justify-between items-center">
                              <div>
                                <span className="font-medium">{related.operationNumber}</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  CBM: {related.cbm} | 入库日期: {related.inboundDate || '未知'}
                                </span>
                              </div>
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  checked={batchSelections[shipmentIndex] === true}
                                  onChange={() => toggleShipmentSelection(shipmentIndex)}
                                />
                                <span className="ml-2 text-gray-700 text-sm">选择</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <h3 className="text-lg font-medium text-gray-900">
                {enableBatchOutbound ? '批量出库货物信息和费用预览' : '货物信息和费用预览'}
              </h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">操作单号</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {enableBatchOutbound 
                      ? `${getBaseOperationNumber(selectedShipment.operationNumber)} (${selectedRelatedShipments.length + 1}个子单)` 
                      : selectedShipment.operationNumber}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">材料参数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedShipment.materialParam}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">体积 (CBM)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {enableBatchOutbound && batchFeePreview 
                      ? batchFeePreview.totalCBM.toFixed(4) 
                      : selectedShipment.cbm}
                  </dd>
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
                  <dd className="mt-1 text-sm font-medium text-red-600">
                    {enableBatchOutbound && batchFeePreview 
                      ? `${batchFeePreview.fee.totalFee.toFixed(2)} USD (合并计算)` 
                      : `${storageFee.totalFee.toFixed(2)} USD`}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">费用明细：</span>
                  <ul className="ml-5 mt-1 list-inside list-disc text-sm text-gray-600">
                    {enableBatchOutbound && batchFeePreview ? (
                      <>
                        <li>0-7天: {batchFeePreview.fee.freeDays}天 × 0 USD/CBM/天 × {batchFeePreview.totalCBM.toFixed(4)} CBM = {batchFeePreview.fee.freeDaysFee.toFixed(2)} USD (免费期)</li>
                        <li>8-30天: {batchFeePreview.fee.standardDays}天 × 1 USD/CBM/天 × {batchFeePreview.totalCBM.toFixed(4)} CBM = {batchFeePreview.fee.standardDaysFee.toFixed(2)} USD</li>
                        <li>31+天: {batchFeePreview.fee.extendedDays}天 × 2 USD/CBM/天 × {batchFeePreview.totalCBM.toFixed(4)} CBM = {batchFeePreview.fee.extendedDaysFee.toFixed(2)} USD</li>
                        <li>总计: {batchFeePreview.fee.totalFee.toFixed(2)} USD (将按CBM比例分配到各子单)</li>
                      </>
                    ) : (
                      <>
                        <li>0-7天: {storageFee.freeDays}天 × 0 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.freeDaysFee.toFixed(2)} USD (免费期)</li>
                        <li>8-30天: {storageFee.standardDays}天 × 1 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.standardDaysFee.toFixed(2)} USD</li>
                        <li>31+天: {storageFee.extendedDays}天 × 2 USD/CBM/天 × {selectedShipment.cbm} CBM = {storageFee.extendedDaysFee.toFixed(2)} USD</li>
                        <li>总计: {storageFee.totalFee.toFixed(2)} USD</li>
                      </>
                    )}
                  </ul>
                </div>
                {enableBatchOutbound && selectedRelatedShipments.length > 0 && (
                  <div className="mt-3 bg-yellow-50 p-2 rounded">
                    <h4 className="text-sm font-medium text-yellow-800">批量出库货物明细：</h4>
                    <ul className="ml-5 mt-1 list-inside text-sm text-gray-600">
                      <li>• {selectedShipment.operationNumber}: {selectedShipment.cbm} CBM</li>
                      {selectedRelatedShipments.map((shipment, idx) => (
                        <li key={idx}>• {shipment.operationNumber}: {shipment.cbm} CBM</li>
                      ))}
                    </ul>
                  </div>
                )}
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
              {enableBatchOutbound ? `确认批量出库 (${selectedRelatedShipments.length + 1}个)` : "确认出库"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 