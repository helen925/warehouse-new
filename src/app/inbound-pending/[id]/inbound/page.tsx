"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  getPendingInboundOrder, 
  completePendingInboundOrder 
} from "@/lib/api/pending-inbound-orders";
import { createShipment } from "@/lib/api/shipments";
import type { PendingInboundOrder } from "@/server/db/schema";

// 生成随机货物编号
const generateShipmentNumber = (): string => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `SH${dateStr}${randomNum}`;
};

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

// 计算CBM (立方米)
const calculateCBM = (length: number, width: number, height: number): number => {
  return (length * width * height) / 1000000; // 厘米转立方米
};

// 计算材重
const calculateMaterialWeight = (length: number, width: number, height: number, materialParam: number): number => {
  return (length * width * height) / materialParam;
};

export default function InboundOperationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<PendingInboundOrder | null>(null);
  const [formData, setFormData] = useState({
    operationNumber: "",
    shipmentNumber: generateShipmentNumber(),
    materialTypeCode: "6000", // 默认材料参数
    quantity: 1,
    actualWeight: "0", // 实重
    length: "0", // 长
    width: "0", // 宽
    height: "0", // 高
    destination: "",
    remarks: ""
  });
  const [calculated, setCalculated] = useState({
    cbm: "0",
    materialWeight: "0",
    totalWeight: "0"
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载待入库订单数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const id = params.id;
        if (!id) {
          setError("无效的订单ID");
          setLoading(false);
          return;
        }
        
        const data = await getPendingInboundOrder(Number(id));
        
        if (!data) {
          setError("找不到该订单");
          setLoading(false);
          return;
        }
        
        // 验证订单状态是否为"已送仓库"
        if (data.status !== "已送仓库") {
          setError(`当前订单状态为"${data.status}"，无法入库。只有"已送仓库"状态的订单才能进行入库操作。`);
          setLoading(false);
          return;
        }
        
        // 如果订单已经完成入库，不能重复入库
        if (data.completedAt) {
          setError("该订单已完成入库操作，不能重复入库");
          setLoading(false);
          return;
        }
        
        setOrder(data);
        
        // 将订单数据初始化到表单中
        setFormData(prev => ({
          ...prev,
          operationNumber: data.operationNumber,
          quantity: data.quantity || 1,
          remarks: data.remarks || ""
        }));
        
        setLoading(false);
      } catch (error) {
        console.error("获取订单详情失败:", error);
        setError("获取订单详情失败");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  // 计算衍生值
  useEffect(() => {
    const length = parseFloat(formData.length);
    const width = parseFloat(formData.width);
    const height = parseFloat(formData.height);
    const materialParam = parseFloat(formData.materialTypeCode);
    const actualWeight = parseFloat(formData.actualWeight);
    
    if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
      return;
    }
    
    // 计算CBM (立方米)
    const cbm = calculateCBM(length, width, height);
    
    // 计算材重
    const materialWeight = calculateMaterialWeight(length, width, height, materialParam);
    
    // 计算计费重（取实重和材重较大值）
    const billingWeight = Math.max(actualWeight, materialWeight);
    
    setCalculated({
      cbm: cbm.toFixed(4),
      materialWeight: materialWeight.toFixed(3),
      totalWeight: billingWeight.toFixed(3)
    });
  }, [formData.length, formData.width, formData.height, formData.materialTypeCode, formData.actualWeight]);

  // 处理输入变化
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 提交表单，创建入库记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    // 验证必填字段
    if (!formData.operationNumber || !formData.shipmentNumber) {
      setError("操作单号和货物编号不能为空");
      return;
    }
    
    const length = parseFloat(formData.length);
    const width = parseFloat(formData.width);
    const height = parseFloat(formData.height);
    
    if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
      setError("长、宽、高必须为大于0的数字");
      return;
    }
    
    if (isNaN(parseFloat(formData.actualWeight)) || parseFloat(formData.actualWeight) <= 0) {
      setError("实重必须为大于0的数字");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // 1. 创建新货物记录
      const shipmentData = {
        operationNumber: formData.operationNumber,
        shipmentNumber: formData.shipmentNumber,
        materialTypeCode: formData.materialTypeCode,
        quantity: Number(formData.quantity),
        actualWeight: formData.actualWeight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        cbm: calculated.cbm,
        totalWeight: calculated.totalWeight,
        materialWeight: calculated.materialWeight,
        destination: formData.destination,
        remarks: formData.remarks,
        // 将当前时间作为入库时间
        createdAt: new Date().toISOString(),
        // 设置当前状态为已入库
        route: "已入库"
      };
      
      // 创建货物记录，并获取返回的ID
      const newShipment = await createShipment(shipmentData);
      
      if (!newShipment || !newShipment.id) {
        throw new Error("创建货物记录失败");
      }
      
      console.log("新建货物成功:", newShipment);
      
      // 2. 将待入库订单标记为已完成，并关联到新建的货物
      const completedOrder = await completePendingInboundOrder(order.id, newShipment.id);
      
      if (!completedOrder) {
        throw new Error("完成入库订单操作失败");
      }
      
      console.log("完成入库订单操作:", completedOrder);
      
      // 3. 成功后跳转到货物详情页
      router.push(`/shipments/${newShipment.id}`);
    } catch (error) {
      console.error("入库操作失败:", error);
      setError("入库操作失败: " + (error instanceof Error ? error.message : "未知错误"));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-red-50 p-6 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">错误</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || "加载订单详情失败"}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    href={`/inbound-pending/${params.id}`}
                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    返回订单详情
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">入库操作</h1>
        <p className="mt-2 text-gray-600">
          将待入库订单转为实际入库货物
        </p>
      </div>

      <div className="mb-6 rounded-lg border bg-blue-50 p-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">订单信息</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p><strong>操作单号:</strong> {order.operationNumber}</p>
              <p><strong>预计到仓日期:</strong> {formatDateDisplay(order.expectedArrivalDate)}</p>
              <p><strong>当前状态:</strong> {order.status}</p>
              {order.description && <p><strong>货物描述:</strong> {order.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border bg-red-50 p-4 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium">基本信息</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="operationNumber" className="block text-sm font-medium text-gray-700">
                操作单号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="operationNumber"
                name="operationNumber"
                value={formData.operationNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="shipmentNumber" className="block text-sm font-medium text-gray-700">
                货物编号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="shipmentNumber"
                name="shipmentNumber"
                value={formData.shipmentNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">系统自动生成的唯一编号，可以根据需要修改</p>
            </div>
            
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                目的地
              </label>
              <select
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              >
                <option value="">请选择目的地</option>
                <option value="沙特">沙特</option>
                <option value="阿联酋">阿联酋</option>
                <option value="美国">美国</option>
                <option value="加拿大">加拿大</option>
                <option value="英国">英国</option>
                <option value="德国">德国</option>
                <option value="法国">法国</option>
                <option value="日本">日本</option>
                <option value="韩国">韩国</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                数量
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium">尺寸与重量</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-700">
                长度(cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="length"
                name="length"
                min="0.01"
                step="0.01"
                value={formData.length}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                宽度(cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="width"
                name="width"
                min="0.01"
                step="0.01"
                value={formData.width}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                高度(cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="height"
                name="height"
                min="0.01"
                step="0.01"
                value={formData.height}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="actualWeight" className="block text-sm font-medium text-gray-700">
                实际重量(kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="actualWeight"
                name="actualWeight"
                min="0.001"
                step="0.001"
                value={formData.actualWeight}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="materialTypeCode" className="block text-sm font-medium text-gray-700">
                材料参数
              </label>
              <select
                id="materialTypeCode"
                name="materialTypeCode"
                value={formData.materialTypeCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              >
                <option value="5000">5000</option>
                <option value="6000">6000</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">用于计算材积重</p>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700">计算结果</h3>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <span className="block text-xs text-gray-500">体积 (CBM)</span>
                <span className="block text-sm font-medium">{calculated.cbm} 立方米</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">材积重</span>
                <span className="block text-sm font-medium">{calculated.materialWeight} kg</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">计费重量</span>
                <span className="block text-sm font-medium">{calculated.totalWeight} kg</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium">备注信息</h2>
          </div>
          
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
              备注
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              placeholder="可填写货物特性、注意事项等"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Link
            href={`/inbound-pending/${order.id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {submitting ? "处理中..." : "完成入库"}
          </button>
        </div>
      </form>
    </main>
  );
} 