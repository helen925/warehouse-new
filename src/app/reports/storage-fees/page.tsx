export default function StorageFeesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">仓储费用报表</h1>
        <p className="mt-2 text-gray-600">查看和计算所有在库货物的仓储费用</p>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">仓储费计算规则</h2>
          <div className="mt-2 sm:mt-0">
            <span className="mr-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
              0-7天: 免费
            </span>
            <span className="mr-2 inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              8-30天: 1 USD/CBM/天
            </span>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">
              30天以上: 2 USD/CBM/天
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">费用将按照阶梯式计算，超过30天的部分按照2 USD/CBM/天计算。</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 flex items-center sm:mb-0">
          <label htmlFor="date-range" className="mr-2 block text-sm font-medium text-gray-700">
            日期范围:
          </label>
          <select
            id="date-range"
            name="date-range"
            className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
            <option value="180">最近180天</option>
            <option value="365">最近1年</option>
            <option value="all">全部</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            导出Excel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
                clipRule="evenodd"
              />
            </svg>
            打印报表
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                货物单号
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                操作编号
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                入库日期
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                已存储天数
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                体积 (CBM)
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                当前仓储费用
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                费用明细
              </th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-900">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">NY250201-1</td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">2023-10-15</td>
              <td className="px-6 py-4">45 天</td>
              <td className="px-6 py-4">0.04</td>
              <td className="px-6 py-4 font-medium text-red-600">3.28 USD</td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-900 hover:underline"
                >
                  查看详情
                </button>
              </td>
              <td className="px-6 py-4">
                <a href="#" className="text-green-600 hover:underline">
                  出库
                </a>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">NY250201-1</td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">2023-11-01</td>
              <td className="px-6 py-4">28 天</td>
              <td className="px-6 py-4">0.17</td>
              <td className="px-6 py-4 font-medium text-red-600">3.57 USD</td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-900 hover:underline"
                >
                  查看详情
                </button>
              </td>
              <td className="px-6 py-4">
                <a href="#" className="text-green-600 hover:underline">
                  出库
                </a>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">NY250201-1</td>
              <td className="px-6 py-4">6000</td>
              <td className="px-6 py-4">2023-12-05</td>
              <td className="px-6 py-4">5 天</td>
              <td className="px-6 py-4">0.13</td>
              <td className="px-6 py-4 font-medium text-green-600">0.00 USD</td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-900 hover:underline"
                >
                  查看详情
                </button>
              </td>
              <td className="px-6 py-4">
                <a href="#" className="text-green-600 hover:underline">
                  出库
                </a>
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <th scope="row" colSpan={5} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                总计
              </th>
              <td className="px-6 py-3 text-sm font-semibold text-gray-900">6.85 USD</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
} 