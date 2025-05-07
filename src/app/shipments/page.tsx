import Link from "next/link";

export default function ShipmentsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">货物管理</h1>
        <Link
          href="/shipments/new"
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          添加新货物
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                单号
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                操作编号
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                数量
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                实际重量
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                尺寸 (长×宽×高)
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                体积 (CBM)
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                目的地
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                状态
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="font-medium">NY250201-1</span>
              </td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4">15.000</td>
              <td className="px-6 py-4">36.00 × 35.00 × 32.00</td>
              <td className="px-6 py-4">0.04</td>
              <td className="px-6 py-4">沙特</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                  在库
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link
                    href={`/shipments/1`}
                    className="text-blue-600 hover:underline"
                  >
                    详情
                  </Link>
                  <Link
                    href={`/operations/outbound?shipmentId=1`}
                    className="text-green-600 hover:underline"
                  >
                    出库
                  </Link>
                </div>
              </td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="font-medium">NY250201-1</span>
              </td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4">9.000</td>
              <td className="px-6 py-4">62.00 × 54.00 × 52.00</td>
              <td className="px-6 py-4">0.17</td>
              <td className="px-6 py-4">沙特</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                  在库
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link
                    href={`/shipments/2`}
                    className="text-blue-600 hover:underline"
                  >
                    详情
                  </Link>
                  <Link
                    href={`/operations/outbound?shipmentId=2`}
                    className="text-green-600 hover:underline"
                  >
                    出库
                  </Link>
                </div>
              </td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="font-medium">NY250201-1</span>
              </td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4">22.000</td>
              <td className="px-6 py-4">56.00 × 50.00 × 47.00</td>
              <td className="px-6 py-4">0.13</td>
              <td className="px-6 py-4">沙特</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-600"></span>
                  已出库
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link
                    href={`/shipments/3`}
                    className="text-blue-600 hover:underline"
                  >
                    详情
                  </Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
} 