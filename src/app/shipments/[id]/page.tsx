"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// 定义本地货物接口，与页面上使用的字段匹配
interface ShipmentDetails {
  id: number;
  shipmentNumber: string;
  operationNumber: string;
  materialTypeCode?: string;
  materialParam?: string | number;
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
  status?: string;
  inboundDate?: string;
  outboundDate?: string;
  storageDays?: number;
  storageFee?: string | number;
  totalShippingWeight?: string;
}

// 定义仓库记录接口
interface WarehouseRecord {
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

// 计算CBM
const calculateCBM = (length: number, width: number, height: number): number => {
  return (length * width * height) / 1000000;
};

// 计算材积重
const calculateMaterialWeight = (length: number, width: number, height: number, materialParam: number): number => {
  return (length * width * height) / materialParam;
};

// 计算单件计费重（取实重和材重的较大值）
const calculateBillingWeight = (actualWeight: number, materialWeight: number): number => {
  return Math.max(actualWeight, materialWeight);
};

// 计算总计费重
const calculateTotalShippingWeight = (billingWeight: number, quantity: number): number => {
  return billingWeight * quantity;
};

// 常见国家列表
const countries = [
  { value: "沙特", label: "沙特阿拉伯" },
  { value: "阿联酋", label: "阿拉伯联合酋长国" },
  { value: "美国", label: "美国" },
  { value: "加拿大", label: "加拿大" },
  { value: "法国", label: "法国" },
  { value: "德国", label: "德国" },
  { value: "意大利", label: "意大利" },
  { value: "英国", label: "英国" },
  { value: "西班牙", label: "西班牙" },
  { value: "澳大利亚", label: "澳大利亚" },
  { value: "新西兰", label: "新西兰" },
  { value: "日本", label: "日本" },
  { value: "韩国", label: "韩国" },
  { value: "新加坡", label: "新加坡" },
  { value: "马来西亚", label: "马来西亚" },
  { value: "泰国", label: "泰国" },
  { value: "印度", label: "印度" },
  { value: "俄罗斯", label: "俄罗斯" },
  { value: "巴西", label: "巴西" },
  { value: "墨西哥", label: "墨西哥" },
  { value: "南非", label: "南非" },
  { value: "埃及", label: "埃及" },
  { value: "土耳其", label: "土耳其" },
];

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [editedShipment, setEditedShipment] = useState<ShipmentDetails | null>(null);
  const [warehouseRecord, setWarehouseRecord] = useState<WarehouseRecord | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingChanges, setSavingChanges] = useState<boolean>(false);

  useEffect(() => {
    // 获取货物ID
    const shipmentId = params.id;
    if (!shipmentId) {
      setError("无效的货物ID");
      setLoading(false);
      return;
    }

    // 从API获取数据
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 先从all shipments API获取所有货物
        const response = await fetch(`/api/shipments?t=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`获取货物失败: ${response.status}`);
        }
        
        const shipments = await response.json();
        const shipmentData = shipments.find((s: any) => s.id === Number(shipmentId));
        
        if (!shipmentData) {
          setError("找不到该货物");
          setLoading(false);
          return;
        }
        
        // 获取仓库记录
        const warehouseResponse = await fetch(`/api/warehouse-records?shipmentId=${shipmentId}`);
        const records = await warehouseResponse.json();
        const record = records.length > 0 ? records[0] : null;
        
        // 将数据合并作为内部使用的shipment对象
        const enhancedShipment: ShipmentDetails = {
          ...shipmentData,
          inboundDate: record?.inboundDate || shipmentData.createdAt,
          outboundDate: record?.outboundDate,
          storageDays: record?.storageDays,
          storageFee: record?.storageFee,
          status: shipmentData.route === '已出库' ? '已出库' : '在库',
          materialParam: shipmentData.materialTypeCode || "6000"
        };
        
        setShipment(enhancedShipment);
        setEditedShipment(JSON.parse(JSON.stringify(enhancedShipment))); // 深拷贝
        setWarehouseRecord(record);
        setLoading(false);
      } catch (err) {
        console.error("加载数据失败:", err);
        setError("加载数据失败");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  // 计算仓储费用（如果货物在库）
  const calculateStorageFee = (shipment: ShipmentDetails): string => {
    if (shipment.status === '已出库' && shipment.storageFee) {
      return `${shipment.storageFee} USD`;
    }
    
    if (!shipment.inboundDate) return "无法计算";
    
    // 计算存储天数
    const inboundDate = new Date(shipment.inboundDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - inboundDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 计算费用
    const cbm = parseFloat(shipment.cbm.toString() || "0");
    
    if (isNaN(cbm)) return "无法计算";
    
    // 阶梯费率计算
    const freeDaysLimit = 7;
    const standardDaysLimit = 30;
    const standardRate = 1; // USD/CBM/天
    const extendedRate = 2; // USD/CBM/天
    
    if (days <= freeDaysLimit) {
      return "0.00 USD (免费期)";
    }
    
    let fee = 0;
    
    if (days > freeDaysLimit) {
      // 标准费率天数
      const standardDays = Math.min(days - freeDaysLimit, standardDaysLimit - freeDaysLimit);
      fee += standardDays * standardRate * cbm;
      
      // 扩展费率天数
      if (days > standardDaysLimit) {
        const extendedDays = days - standardDaysLimit;
        fee += extendedDays * extendedRate * cbm;
      }
    }
    
    return `${fee.toFixed(2)} USD (计算至今)`;
  };

  // 处理表单输入变化
  const handleInputChange = (field: keyof ShipmentDetails, value: string | number) => {
    if (!editedShipment) return;
    
    const updatedShipment = { ...editedShipment, [field]: value } as ShipmentDetails;
    
    // 如果修改了入库日期，重新计算存储天数和仓储费用
    if (field === 'inboundDate') {
      // 计算新的存储天数
      const inboundDate = value as string;
      const outboundDate = updatedShipment.outboundDate;
      const storageDays = calculateStorageDays(inboundDate, outboundDate);
      updatedShipment.storageDays = storageDays;
      
      // 如果已出库，重新计算仓储费用
      if (updatedShipment.status === '已出库') {
        const cbm = parseFloat(updatedShipment.cbm.toString() || "0");
        if (!isNaN(cbm)) {
          // 计算费用
          const fee = calculateStorageFeeValue(cbm, storageDays);
          updatedShipment.storageFee = fee.toFixed(2);
        }
      }
    }
    
    // 如果修改了长宽高或材料参数，重新计算相关值
    if (field === 'length' || field === 'width' || field === 'height' || field === 'materialParam' || field === 'actualWeight' || field === 'quantity') {
      const length = parseFloat(updatedShipment.length.toString() || "0");
      const width = parseFloat(updatedShipment.width.toString() || "0");
      const height = parseFloat(updatedShipment.height.toString() || "0");
      const materialParam = parseFloat(updatedShipment.materialParam?.toString() || "6000");
      const actualWeight = parseFloat(updatedShipment.actualWeight.toString() || "0");
      const quantity = parseFloat(updatedShipment.quantity.toString() || "1");
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(height) && !isNaN(materialParam) && materialParam > 0) {
        // 计算CBM
        const cbmValue = calculateCBM(length, width, height);
        updatedShipment.cbm = cbmValue.toFixed(4);
        
        // 计算材积重
        const materialWeightValue = calculateMaterialWeight(length, width, height, materialParam);
        updatedShipment.materialWeight = materialWeightValue.toFixed(3);
        
        // 计算单件计费重 (取实重和材积重的较大值)
        if (!isNaN(actualWeight)) {
          const billingWeight = calculateBillingWeight(actualWeight, materialWeightValue);
          updatedShipment.totalWeight = billingWeight.toFixed(3);
          
          // 计算总计费重
          if (!isNaN(quantity)) {
            const totalShippingWeight = calculateTotalShippingWeight(billingWeight, quantity);
            updatedShipment.totalShippingWeight = totalShippingWeight.toFixed(3);
          }
        }
        
        // 如果CBM变更且为已出库状态，重新计算仓储费用
        if (updatedShipment.status === '已出库' && updatedShipment.storageDays) {
          const storageDays = updatedShipment.storageDays;
          const fee = calculateStorageFeeValue(cbmValue, storageDays);
          updatedShipment.storageFee = fee.toFixed(2);
        }
      }
    }
    
    // 如果修改状态为已出库，但没有出库日期，设置为今天
    if (field === 'status' && value === '已出库' && !updatedShipment.outboundDate) {
      const today = new Date().toISOString().split('T')[0];
      updatedShipment.outboundDate = today;
      
      // 计算存储天数和费用
      if (updatedShipment.inboundDate) {
        const storageDays = calculateStorageDays(updatedShipment.inboundDate, today);
        updatedShipment.storageDays = storageDays;
        
        const cbm = parseFloat(updatedShipment.cbm.toString() || "0");
        if (!isNaN(cbm)) {
          const fee = calculateStorageFeeValue(cbm, storageDays);
          updatedShipment.storageFee = fee.toFixed(2);
        }
      }
    }
    
    // 如果修改了出库日期，重新计算存储天数和费用
    if (field === 'outboundDate' && updatedShipment.inboundDate) {
      const storageDays = calculateStorageDays(updatedShipment.inboundDate, value as string);
      updatedShipment.storageDays = storageDays;
      
      const cbm = parseFloat(updatedShipment.cbm.toString() || "0");
      if (!isNaN(cbm)) {
        const fee = calculateStorageFeeValue(cbm, storageDays);
        updatedShipment.storageFee = fee.toFixed(2);
      }
    }
    
    setEditedShipment(updatedShipment);
  };

  // 计算存储天数辅助函数
  const calculateStorageDays = (inboundDate: string | undefined, outboundDate: string | undefined): number => {
    if (!inboundDate) return 0;
    
    const start = new Date(inboundDate);
    const end = outboundDate ? new Date(outboundDate) : new Date(); // 如果没有出库日期，使用今天的日期
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 计算仓储费用辅助函数 (返回数值)
  const calculateStorageFeeValue = (cbm: number, days: number): number => {
    const freeDaysLimit = 7;
    const standardDaysLimit = 30;
    const standardRate = 1; // USD/CBM/天
    const extendedRate = 2; // USD/CBM/天
    
    if (days <= freeDaysLimit) {
      return 0; // 免费期
    }
    
    let fee = 0;
    
    if (days > freeDaysLimit) {
      // 标准费率天数
      const standardDays = Math.min(days - freeDaysLimit, standardDaysLimit - freeDaysLimit);
      fee += standardDays * standardRate * cbm;
      
      // 扩展费率天数
      if (days > standardDaysLimit) {
        const extendedDays = days - standardDaysLimit;
        fee += extendedDays * extendedRate * cbm;
      }
    }
    
    return fee;
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editedShipment || !editedShipment.id) return;
    
    try {
      setSavingChanges(true);
      
      // 转换编辑后的数据为API格式
      const apiShipmentData = {
        operationNumber: editedShipment.operationNumber,
        materialTypeCode: editedShipment.materialParam?.toString(),
        quantity: Number(editedShipment.quantity),
        actualWeight: editedShipment.actualWeight?.toString(),
        length: editedShipment.length?.toString(),
        width: editedShipment.width?.toString(),
        height: editedShipment.height?.toString(),
        materialWeight: editedShipment.materialWeight?.toString(),
        cbm: editedShipment.cbm?.toString(),
        totalWeight: editedShipment.totalWeight?.toString(),
        destination: editedShipment.destination || "",
        route: editedShipment.status === '已出库' ? '已出库' : undefined,
        remarks: editedShipment.remarks || ""
      };
      
      // 调用API更新货物信息
      const response = await fetch('/api/shipments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: editedShipment.id, ...apiShipmentData }),
      });
      
      if (!response.ok) {
        throw new Error(`更新货物失败: ${response.statusText}`);
      }
      
      // 确保有入库日期数据
      let formattedInboundDate = editedShipment.inboundDate;
      
      // 如果入库日期是通过日期选择器修改的，它可能只有日期部分，需要确保格式正确
      if (formattedInboundDate && !formattedInboundDate.includes(' ') && !formattedInboundDate.includes('T')) {
        // 添加时间部分，确保格式为 YYYY-MM-DD HH:MM:SS 或 ISO 格式
        formattedInboundDate = `${formattedInboundDate}T00:00:00`;
      }
      
      console.log("更新的入库日期:", formattedInboundDate);
      
      // 如果有仓库记录，也要更新仓库记录
      if (warehouseRecord && warehouseRecord.id) {
        // 计算存储天数
        if (!formattedInboundDate) {
          console.error("入库日期为空，使用当前日期");
          formattedInboundDate = new Date().toISOString();
        }
        
        const newInboundDate = new Date(formattedInboundDate);
        const currentDate = warehouseRecord.outboundDate 
          ? new Date(warehouseRecord.outboundDate) 
          : new Date();
          
        const storageDays = Math.ceil(
          (currentDate.getTime() - newInboundDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        console.log("计算的存储天数:", storageDays, "入库日期:", formattedInboundDate);
        
        const warehouseData = {
          inboundDate: formattedInboundDate,
          storageDays: storageDays > 0 ? storageDays : 1
        };
        
        console.log("提交更新仓库记录数据:", warehouseData);
        
        const warehouseResponse = await fetch('/api/warehouse-records', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: warehouseRecord.id, ...warehouseData }),
        });
        
        if (!warehouseResponse.ok) {
          const errorText = await warehouseResponse.text();
          console.warn("更新仓库记录失败:", warehouseResponse.status, errorText);
        } else {
          console.log("仓库记录更新成功");
        }
      } else if (editedShipment.inboundDate) {
        // 如果没有仓库记录，但有入库日期，创建新记录
        const newRecord = {
          shipmentId: editedShipment.id,
          inboundDate: formattedInboundDate,
          status: "in_warehouse",
          freeDays: 7,
          standardRate: "1.00",
          extendedRate: "2.00",
          standardDaysLimit: 30,
        };
        
        console.log("创建新仓库记录:", newRecord);
        
        const createResponse = await fetch('/api/warehouse-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRecord),
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.warn("创建仓库记录失败:", createResponse.status, errorText);
        } else {
          console.log("新仓库记录创建成功");
        }
      }
      
      // 更新状态
      setShipment(editedShipment);
      setIsEditing(false);
      setSavingChanges(false);
      
      // 显示成功提示
      alert("修改已保存");
      
      // 刷新页面以获取最新数据
      window.location.reload();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败: " + (error instanceof Error ? error.message : "未知错误"));
      setSavingChanges(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (shipment) {
      setEditedShipment(JSON.parse(JSON.stringify(shipment))); // 重置为原始值
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </main>
    );
  }

  if (error || !shipment || !editedShipment) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-red-50 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-2">错误</h1>
          <p className="text-gray-700">{error || "未知错误"}</p>
          <div className="mt-4">
            <Link
              href="/shipments"
              className="text-blue-600 hover:underline"
            >
              返回货物列表
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">货物详情</h1>
          <div className="flex space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
                  disabled={savingChanges}
                >
                  编辑信息
                </button>
                <Link
                  href="/shipments"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  返回货物列表
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                  disabled={savingChanges}
                >
                  {savingChanges ? "保存中..." : "保存修改"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  disabled={savingChanges}
                >
                  取消编辑
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          操作单号: 
          {isEditing ? (
            <input
              type="text"
              className="ml-1 px-2 py-1 border rounded"
              value={editedShipment.operationNumber}
              onChange={(e) => handleInputChange('operationNumber', e.target.value)}
            />
          ) : (
            <span className="font-semibold">{shipment.operationNumber}</span>
          )}
        </p>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <div className="px-4 py-5 sm:px-6 bg-purple-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">基本信息</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">目的地</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={editedShipment.destination || ""}
                        onChange={(e) => handleInputChange('destination', e.target.value)}
                      >
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      shipment.destination || "-"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">入库日期</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={editedShipment.inboundDate ? editedShipment.inboundDate.split(' ')[0] : ""}
                        onChange={(e) => handleInputChange('inboundDate', e.target.value)}
                      />
                    ) : (
                      formatDateDisplay(shipment.inboundDate)
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">出库日期</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing && shipment.status === '已出库' ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={editedShipment.outboundDate ? editedShipment.outboundDate.split(' ')[0] : ""}
                        onChange={(e) => handleInputChange('outboundDate', e.target.value)}
                      />
                    ) : (
                      formatDateDisplay(shipment.outboundDate)
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">状态</dt>
                  <dd className="mt-1 text-sm">
                    {isEditing ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={editedShipment.status || '在库'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="在库">在库</option>
                        <option value="已出库">已出库</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${shipment.status === '已出库' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${shipment.status === '已出库' ? 'bg-yellow-600' : 'bg-green-600'}`}></span>
                        {shipment.status || '在库'}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">材料参数</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={editedShipment.materialParam || "6000"}
                        onChange={(e) => handleInputChange('materialParam', e.target.value)}
                      >
                        <option value="5000">5000</option>
                        <option value="6000">6000</option>
                      </select>
                    ) : (
                      shipment.materialParam
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">件数</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                      />
                    ) : (
                      shipment.quantity
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">尺寸和重量</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">长(cm)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.length}
                        onChange={(e) => handleInputChange('length', e.target.value)}
                      />
                    ) : (
                      shipment.length
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">宽(cm)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.width}
                        onChange={(e) => handleInputChange('width', e.target.value)}
                      />
                    ) : (
                      shipment.width
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">高(cm)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                      />
                    ) : (
                      shipment.height
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">实重(kg)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.actualWeight}
                        onChange={(e) => handleInputChange('actualWeight', e.target.value)}
                      />
                    ) : (
                      shipment.actualWeight
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">材重(kg)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {editedShipment.materialWeight}
                    {isEditing && <div className="text-xs text-gray-500">自动计算</div>}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">单件方数(CBM)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {editedShipment.cbm}
                    {isEditing && <div className="text-xs text-gray-500">自动计算</div>}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">单件计费重</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {editedShipment.totalWeight}
                    {isEditing && <div className="text-xs text-gray-500">自动计算</div>}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">总计费重</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {editedShipment.totalShippingWeight}
                    {isEditing && <div className="text-xs text-gray-500">自动计算</div>}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <div className="px-4 py-5 sm:px-6 bg-orange-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">仓储信息</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">存储天数</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing && shipment.status === '已出库' ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.storageDays || 0}
                        onChange={(e) => handleInputChange('storageDays', parseInt(e.target.value))}
                      />
                    ) : (
                      <>
                        {shipment.storageDays || 
                         (shipment.inboundDate ? 
                          Math.ceil(Math.abs(new Date().getTime() - new Date(shipment.inboundDate).getTime()) / (1000 * 60 * 60 * 24)) : 
                          "-")}
                        {shipment.status !== '已出库' && " (截至今天)"}
                      </>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">仓储费用</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing && shipment.status === '已出库' ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.storageFee || 0}
                        onChange={(e) => handleInputChange('storageFee', e.target.value)}
                      />
                    ) : (
                      <>
                        {shipment.status === '已出库' && shipment.storageFee ? 
                          `${shipment.storageFee} USD` : 
                          calculateStorageFee(shipment)}
                      </>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">备注</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="border rounded px-2 py-1 w-full"
                        value={editedShipment.remarks || ""}
                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                      ></textarea>
                    ) : (
                      shipment.remarks || "-"
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <div>
            {!isEditing && (
              <Link
                href="/shipments"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                返回
              </Link>
            )}
          </div>
          <div className="space-x-3">
            {!isEditing && shipment.status !== '已出库' && (
              <Link
                href={`/operations/outbound?shipmentId=${Number(params.id)}`}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
              >
                出库操作
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 