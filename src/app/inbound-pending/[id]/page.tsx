"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  getPendingInboundOrder, 
  updatePendingInboundOrder, 
  deletePendingInboundOrder 
} from "@/lib/api/pending-inbound-orders";
import type { PendingInboundOrder } from "@/server/db/schema";

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

// 获取状态标签颜色
const getStatusColor = (status: string): { bg: string, text: string, dot: string } => {
  switch(status) {
    case "待提货":
      return { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-600" };
    case "提货中":
      return { bg: "bg-yellow-50", text: "text-yellow-600", dot: "bg-yellow-600" };
    case "已送仓库":
      return { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-600" };
    case "已入库":
      return { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-600" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-600" };
  }
};

// 格式化日期为YYYY-MM-DD格式（用于日期输入控件）
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] || "";
  } catch (e) {
    return "";
  }
};

export default function PendingInboundOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<PendingInboundOrder | null>(null);
  const [editedOrder, setEditedOrder] = useState<PendingInboundOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 加载订单数据
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
        
        setOrder(data);
        setEditedOrder(JSON.parse(JSON.stringify(data))); // 深拷贝
        setLoading(false);
      } catch (error) {
        console.error("获取订单详情失败:", error);
        setError("获取订单详情失败");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  // 处理输入变更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedOrder) return;
    
    const { name, value } = e.target;
    setEditedOrder({ ...editedOrder, [name]: value });
  };

  // 切换到编辑模式
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 重置为原始数据
    if (order) {
      setEditedOrder(JSON.parse(JSON.stringify(order)));
    }
    setIsEditing(false);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editedOrder || !editedOrder.id) return;
    
    try {
      setSaveLoading(true);
      
      // 准备更新数据
      const updateData: Partial<PendingInboundOrder> = {
        operationNumber: editedOrder.operationNumber,
        status: editedOrder.status,
        quantity: editedOrder.quantity,
        description: editedOrder.description,
        contactPerson: editedOrder.contactPerson,
        contactPhone: editedOrder.contactPhone,
        remarks: editedOrder.remarks
      };
      
      // 如果修改了预计到仓日期，转换为ISO日期格式
      if (editedOrder.expectedArrivalDate) {
        const expectedDate = new Date(editedOrder.expectedArrivalDate);
        updateData.expectedArrivalDate = expectedDate.toISOString();
      }
      
      // 发送更新请求
      const updatedOrder = await updatePendingInboundOrder(editedOrder.id, updateData);
      
      if (updatedOrder) {
        setOrder(updatedOrder);
        setIsEditing(false);
        setError(null);
      } else {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.error("保存编辑失败:", error);
      setError("保存编辑失败，请重试");
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 确认删除对话框
  const handleToggleDeleteConfirm = () => {
    setShowDeleteConfirm(!showDeleteConfirm);
  };

  // 删除订单
  const handleDelete = async () => {
    if (!order || !order.id) return;
    
    try {
      setDeleteLoading(true);
      
      const success = await deletePendingInboundOrder(order.id);
      
      if (success) {
        // 删除成功，返回列表页
        router.push("/inbound-pending");
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      setError("删除订单失败，请重试");
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order || !editedOrder) {
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
                    href="/inbound-pending"
                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    返回订单列表
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">待入库订单详情</h1>
            <p className="mt-2 text-gray-600">
              操作单号: <span className="font-semibold">{order.operationNumber}</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
                >
                  编辑
                </button>
                <Link
                  href="/inbound-pending"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  返回
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={saveLoading}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
                >
                  {saveLoading ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </>
            )}
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

      <div className="space-y-6">
        <div className="rounded-lg border bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">订单信息</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">操作单号</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="operationNumber"
                      value={editedOrder.operationNumber}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  ) : (
                    order.operationNumber
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">预计到仓日期</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="date"
                      name="expectedArrivalDate"
                      value={formatDateForInput(editedOrder.expectedArrivalDate)}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  ) : (
                    formatDateDisplay(order.expectedArrivalDate)
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">当前状态</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <select
                      name="status"
                      value={editedOrder.status}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    >
                      <option value="待提货">待提货</option>
                      <option value="提货中">提货中</option>
                      <option value="已送仓库">已送仓库</option>
                      {order.completedAt && <option value="已入库">已入库</option>}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`}></span>
                      {order.status}
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">数量</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={editedOrder.quantity || 1}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  ) : (
                    order.quantity || 1
                  )}
                </dd>
              </div>
              {order.completedAt && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">完成入库时间</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateDisplay(order.completedAt)}
                  </dd>
                </div>
              )}
              {order.shipmentId && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">关联货物</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/shipments/${order.shipmentId}`}
                      className="text-purple-600 hover:text-purple-900 hover:underline"
                    >
                      查看入库货物 #{order.shipmentId || ""}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">货物描述</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <textarea
                      name="description"
                      rows={3}
                      value={editedOrder.description || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    ></textarea>
                  ) : (
                    order.description || "-"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">联系信息</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">联系人</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPerson"
                      value={editedOrder.contactPerson || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  ) : (
                    order.contactPerson || "-"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">联系电话</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="contactPhone"
                      value={editedOrder.contactPhone || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  ) : (
                    order.contactPhone || "-"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">备注</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isEditing ? (
                    <textarea
                      name="remarks"
                      rows={3}
                      value={editedOrder.remarks || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    ></textarea>
                  ) : (
                    order.remarks || "-"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {!isEditing && order.status === "已送仓库" && !order.completedAt && (
          <div className="flex justify-end">
            <Link
              href={`/inbound-pending/${order.id}/inbound`}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              开始入库
            </Link>
          </div>
        )}

        {!isEditing && !order.completedAt && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">危险区域</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>删除此订单将无法恢复。</p>
                </div>
                <div className="mt-4">
                  {showDeleteConfirm ? (
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
                      >
                        {deleteLoading ? "删除中..." : "确认删除"}
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleDeleteConfirm}
                        disabled={deleteLoading}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleDeleteConfirm}
                      className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      删除订单
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 