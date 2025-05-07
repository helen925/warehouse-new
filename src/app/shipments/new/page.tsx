"use client";

import { useState, useEffect } from "react";
import { calculateCBM } from "@/lib/utils/storage-fee";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

// 格式化日期为 YYYY-MM-DD 格式
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取今天的日期，格式为 YYYY-MM-DD
const today = formatDate(new Date());

export default function NewShipmentPage() {
  const router = useRouter();
  const [length, setLength] = useState<number | string>("");
  const [width, setWidth] = useState<number | string>("");
  const [height, setHeight] = useState<number | string>("");
  const [actualWeight, setActualWeight] = useState<number | string>("");
  const [materialParam, setMaterialParam] = useState<number | string>("6000"); // 默认材积参数为6000
  const [materialWeight, setMaterialWeight] = useState<number | string>("");
  const [cbm, setCbm] = useState<number | string>("");
  const [totalWeight, setTotalWeight] = useState<number | string>("");
  const [totalShippingWeight, setTotalShippingWeight] = useState<number | string>(""); // 总计费重
  const [destination, setDestination] = useState<string>("沙特"); // 默认选择沙特
  const [operationNumber, setOperationNumber] = useState<string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [remarks, setRemarks] = useState<string>("");
  const [inboundDate, setInboundDate] = useState<string>(today); // 入库日期，默认今天

  // 计算CBM、材积重和计费重
  useEffect(() => {
    // 计算CBM和材积重
    if (width && height && length && materialParam) {
      const widthNum = parseFloat(width.toString());
      const heightNum = parseFloat(height.toString());
      const lengthNum = parseFloat(length.toString());
      const materialParamNum = parseFloat(materialParam.toString());
      
      if (!isNaN(widthNum) && !isNaN(heightNum) && !isNaN(lengthNum) && !isNaN(materialParamNum) && materialParamNum > 0) {
        // 计算CBM = 长*宽*高/1000000
        const cbmValue = (lengthNum * widthNum * heightNum) / 1000000;
        setCbm(cbmValue.toFixed(4)); // 保留4位小数
        
        // 计算材积重 = (长*宽*高)/材积参数
        const materialWeightValue = (lengthNum * widthNum * heightNum) / materialParamNum;
        setMaterialWeight(parseFloat(materialWeightValue.toFixed(3)));
      }
    }

    // 计算计费重：比较实重和材重，取较大值
    if (actualWeight && materialWeight) {
      const actualWeightNum = parseFloat(actualWeight.toString());
      const materialWeightNum = parseFloat(materialWeight.toString());
      
      if (!isNaN(actualWeightNum) && !isNaN(materialWeightNum)) {
        // 取大原则 - 取实重和材重的较大值
        const billingWeight = Math.max(actualWeightNum, materialWeightNum);
        setTotalWeight(billingWeight.toFixed(3));
      } else if (!isNaN(actualWeightNum)) {
        setTotalWeight(actualWeightNum.toFixed(3));
      }
    } else if (actualWeight) {
      const actualWeightNum = parseFloat(actualWeight.toString());
      if (!isNaN(actualWeightNum)) {
        setTotalWeight(actualWeightNum.toFixed(3));
      }
    }
  }, [length, width, height, actualWeight, materialParam, materialWeight]);

  // 计算总计费重 = 单件计费重 * 件数
  useEffect(() => {
    if (totalWeight && quantity) {
      const weightNum = parseFloat(totalWeight.toString());
      const quantityNum = parseFloat(quantity.toString());
      
      if (!isNaN(weightNum) && !isNaN(quantityNum)) {
        const total = weightNum * quantityNum;
        setTotalShippingWeight(total.toFixed(3));
      }
    } else {
      setTotalShippingWeight("");
    }
  }, [totalWeight, quantity]);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 创建新货物对象
    const newShipment = {
      operationNumber,
      materialParam,
      quantity,
      actualWeight,
      length,
      width,
      height,
      materialWeight,
      cbm,
      totalWeight, // 单件计费重
      totalShippingWeight, // 总计费重
      destination,
      remarks,
      inboundDate, // 入库日期
      status: '在库' // 设置初始状态为"在库"
    };
    
    // 从localStorage获取现有货物
    const existingShipments = localStorage.getItem('shipments') 
      ? JSON.parse(localStorage.getItem('shipments') || '[]') 
      : [];
    
    // 添加新货物
    const updatedShipments = [...existingShipments, newShipment];
    
    // 保存回localStorage
    localStorage.setItem('shipments', JSON.stringify(updatedShipments));
    
    // 跳转到货物管理页面
    router.push('/shipments');
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">添加新货物</h1>
        <p className="mt-2 text-gray-600">填写货物基本信息（添加即入库）</p>
      </div>

      <style jsx global>{`
        /* 移除数字输入框的上下箭头 */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        /* 移除边框和轮廓 */
        .no-border-input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          padding: 4px;
        }
        .no-border-input:focus {
          box-shadow: none;
          outline: none;
          border: none;
        }
      `}</style>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">操作单号</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">材料参数</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">件数</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">实重(kg)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">长(cm)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">宽(cm)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">高(cm)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">材重(kg)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">单件方数(CBM)</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">单件计费重</th>
                  <th className="border px-3 py-2 bg-gray-50 font-medium">总计费重</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2">
                    <input
                      type="text"
                      name="operationNumber"
                      id="operationNumber"
                      className="no-border-input"
                      placeholder="例如: NY250201-1"
                      value={operationNumber}
                      onChange={(e) => setOperationNumber(e.target.value)}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <select
                      name="materialTypeCode"
                      id="materialTypeCode"
                      className="no-border-input"
                      value={materialParam}
                      onChange={(e) => setMaterialParam(e.target.value)}
                    >
                      <option value="5000">5000</option>
                      <option value="6000">6000</option>
                    </select>
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="text"
                      name="quantity"
                      id="quantity"
                      className="no-border-input"
                      value={quantity}
                      onChange={(e) => {
                        // 只允许输入数字和小数点
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setQuantity(value);
                        }
                      }}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2 bg-red-50">
                    <input
                      type="text"
                      name="actualWeight"
                      id="actualWeight"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 15.000"
                      value={actualWeight}
                      onChange={(e) => {
                        // 只允许输入数字和小数点
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setActualWeight(value);
                        }
                      }}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2 bg-red-50">
                    <input
                      type="text"
                      name="length"
                      id="length"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 36.00"
                      value={length}
                      onChange={(e) => {
                        // 只允许输入数字和小数点
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setLength(value);
                        }
                      }}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2 bg-red-50">
                    <input
                      type="text"
                      name="width"
                      id="width"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 35.00"
                      value={width}
                      onChange={(e) => {
                        // 只允许输入数字和小数点
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setWidth(value);
                        }
                      }}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2 bg-red-50">
                    <input
                      type="text"
                      name="height"
                      id="height"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 32.00"
                      value={height}
                      onChange={(e) => {
                        // 只允许输入数字和小数点
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          setHeight(value);
                        }
                      }}
                      required
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="text"
                      name="materialWeight"
                      id="materialWeight"
                      className="no-border-input"
                      placeholder="例如: 6.720"
                      value={materialWeight || ""}
                      readOnly
                    />
                    <div className="text-xs text-gray-500">自动计算</div>
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="text"
                      name="cbm"
                      id="cbm"
                      className="no-border-input"
                      placeholder="例如: 0.04"
                      value={cbm || ""}
                      readOnly
                    />
                    <div className="text-xs text-gray-500">自动计算</div>
                  </td>
                  <td className="border px-3 py-2 bg-orange-50">
                    <input
                      type="text"
                      name="totalWeight"
                      id="totalWeight"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 15.000"
                      value={totalWeight}
                      readOnly
                    />
                    <div className="text-xs text-gray-500">自动计算</div>
                  </td>
                  <td className="border px-3 py-2 bg-green-50">
                    <input
                      type="text"
                      name="totalShippingWeight"
                      id="totalShippingWeight"
                      className="no-border-input bg-transparent"
                      placeholder="例如: 45.000"
                      value={totalShippingWeight}
                      readOnly
                    />
                    <div className="text-xs text-gray-500">自动计算</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                目的地
              </label>
              <select
                name="destination"
                id="destination"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="inboundDate" className="block text-sm font-medium text-gray-700 mb-1">
                入库日期
              </label>
              <input
                type="date"
                name="inboundDate"
                id="inboundDate"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={inboundDate}
                onChange={(e) => setInboundDate(e.target.value)}
                max={today} // 限制最大日期为今天
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              name="remarks"
              id="remarks"
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            ></textarea>
          </div>

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
            >
              保存并入库
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 