"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPendingInboundOrder } from "@/lib/api/pending-inbound-orders";

export default function NewPendingInboundOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    operationNumber: "",
    expectedArrivalDate: "",
    status: "待提货", // 默认状态
    quantity: 1,
    description: "",
    contactPerson: "",
    contactPhone: "",
    remarks: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.operationNumber) {
      newErrors.operationNumber = "操作单号不能为空";
    }
    
    if (!formData.expectedArrivalDate) {
      newErrors.expectedArrivalDate = "预计到仓日期不能为空";
    }
    
    // 验证数量是否为正整数
    if (formData.quantity <= 0) {
      newErrors.quantity = "数量必须大于0";
    }
    
    // 设置错误状态
    setErrors(newErrors);
    
    // 如果没有错误，返回true
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // 改进日期处理，确保日期格式正确
      let isoDate = "";
      try {
        // 处理日期字符串，确保格式正确
        const expectedDate = new Date(formData.expectedArrivalDate);
        if (isNaN(expectedDate.getTime())) {
          throw new Error("日期格式无效");
        }
        isoDate = expectedDate.toISOString();
      } catch (dateError) {
        console.error("日期格式化错误:", dateError);
        setSubmitError("日期格式无效，请使用有效的日期格式");
        setSubmitting(false);
        return;
      }
      
      // 准备提交数据，只包含必要字段
      const submitData = {
        operationNumber: formData.operationNumber,
        expectedArrivalDate: isoDate,
        status: formData.status,
        quantity: Number(formData.quantity),
        description: formData.description || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        remarks: formData.remarks || undefined
      };
      
      console.log("正在提交订单数据:", submitData);
      
      // 使用fetch提交数据
      const response = await fetch('/api/pending-inbound-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      // 获取原始响应文本
      const responseText = await response.text();
      console.log("API响应:", response.status, responseText);
      
      // 解析JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("解析响应JSON失败:", e);
        throw new Error(`服务器返回了无效的JSON: ${responseText.slice(0, 100)}...`);
      }
      
      // 处理错误响应
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || "未知错误";
        const errorDetails = responseData?.details || "";
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ""}`);
      }
      
      // 检查响应数据
      if (responseData && (responseData.id || responseData.operation_number)) {
        // 创建成功，跳转到列表页
        console.log("订单创建成功:", responseData);
        router.push("/inbound-pending");
      } else {
        throw new Error("创建订单失败，服务器返回的数据格式不正确");
      }
    } catch (error) {
      console.error("提交订单失败:", error);
      // 显示更详细的错误信息
      const errorMessage = error instanceof Error 
        ? `提交订单失败: ${error.message}` 
        : "提交订单失败，请重试";
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">添加待入库订单</h1>
        <p className="mt-2 text-gray-600">填写货物信息，创建待入库订单</p>
      </div>

      {submitError && (
        <div className="mb-6 rounded-lg border bg-red-50 p-4 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
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
                className={`mt-1 block w-full rounded-md border ${
                  errors.operationNumber ? "border-red-300" : "border-gray-300"
                } px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm`}
              />
              {errors.operationNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.operationNumber}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="expectedArrivalDate" className="block text-sm font-medium text-gray-700">
                预计到仓日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expectedArrivalDate"
                name="expectedArrivalDate"
                value={formData.expectedArrivalDate}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.expectedArrivalDate ? "border-red-300" : "border-gray-300"
                } px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm`}
              />
              {errors.expectedArrivalDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expectedArrivalDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                当前状态
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              >
                <option value="待提货">待提货</option>
                <option value="提货中">提货中</option>
                <option value="已送仓库">已送仓库</option>
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
                className={`mt-1 block w-full rounded-md border ${
                  errors.quantity ? "border-red-300" : "border-gray-300"
                } px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                货物描述
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                placeholder="描述货物类型、特征等信息"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-medium">联系信息</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                联系人
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                联系电话
              </label>
              <input
                type="text"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                备注信息
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                value={formData.remarks}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                placeholder="其他需要说明的情况"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Link
            href="/inbound-pending"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {submitting ? "提交中..." : "保存"}
          </button>
        </div>
      </form>
    </main>
  );
} 