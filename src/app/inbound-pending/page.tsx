"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPendingInboundOrders, getPendingInboundOrdersByStatus } from "@/lib/api/pending-inbound-orders";
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

export default function PendingInboundOrdersPage() {
  const [orders, setOrders] = useState<PendingInboundOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PendingInboundOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // 加载待入库订单数据
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        let data;
        if (statusFilter === "all") {
          data = await getAllPendingInboundOrders(true);
        } else {
          data = await getPendingInboundOrdersByStatus(statusFilter);
        }
        
        if (isMounted) {
          setOrders(data);
          setFilteredOrders(data);
          setLoading(false);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error("加载待入库订单失败:", error);
        if (isMounted) {
          setError("加载数据失败，请重试");
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // 设置定时刷新 (每60秒刷新一次)
    const interval = setInterval(loadData, 60000);
    setRefreshInterval(interval);
    
    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [statusFilter]);

  // 处理状态筛选变化
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  // 手动刷新
  const handleRefresh = () => {
    // 清除并重置刷新定时器
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    // 手动触发数据加载
    setStatusFilter(prevFilter => prevFilter);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">待入库订单</h1>
            <p className="mt-2 text-gray-600">管理即将入库的货物订单</p>
            {lastUpdated && (
              <p className="mt-1 text-xs text-gray-500">
                最后更新: {lastUpdated} {loading && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>}
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/inbound-pending/new"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
            >
              添加待入库订单
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilterChange("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            statusFilter === "all"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          全部
        </button>
        <button
          onClick={() => handleStatusFilterChange("待提货")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            statusFilter === "待提货"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          待提货
        </button>
        <button
          onClick={() => handleStatusFilterChange("提货中")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            statusFilter === "提货中"
              ? "bg-yellow-600 text-white"
              : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          }`}
        >
          提货中
        </button>
        <button
          onClick={() => handleStatusFilterChange("已送仓库")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            statusFilter === "已送仓库"
              ? "bg-green-600 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          已送仓库
        </button>
        <button
          className="ml-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={handleRefresh}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
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

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-purple-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">操作单号</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">预计到仓日期</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">货物描述</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">数量</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">联系人</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">状态</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-solid border-purple-500 border-t-transparent"></div>
                    <span className="ml-2">加载数据中...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-gray-500">暂无待入库订单</p>
                  <Link href="/inbound-pending/new" className="mt-2 inline-block text-purple-600 hover:underline">
                    添加新订单
                  </Link>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.operationNumber}</td>
                    <td className="px-6 py-4">
                      {formatDateDisplay(order.expectedArrivalDate)}
                    </td>
                    <td className="px-6 py-4">
                      {order.description || "无描述"}
                    </td>
                    <td className="px-6 py-4">
                      {order.quantity || 1}
                    </td>
                    <td className="px-6 py-4">
                      {order.contactPerson ? (
                        <div>
                          <div>{order.contactPerson}</div>
                          <div className="text-xs text-gray-400">{order.contactPhone}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`}></span>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/inbound-pending/${order.id}`}
                          className="text-purple-600 hover:text-purple-900 hover:underline"
                        >
                          详情
                        </Link>
                        {order.status === "已送仓库" && !order.completedAt && (
                          <Link
                            href={`/inbound-pending/${order.id}/inbound`}
                            className="text-green-600 hover:text-green-900 hover:underline"
                          >
                            入库
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
} 