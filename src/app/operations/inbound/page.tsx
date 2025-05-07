import Link from "next/link";

export default function InboundOperationPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">入库操作</h1>
        <p className="mt-2 text-gray-600">记录货物入库信息</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action="#" method="POST">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-1">
              <label htmlFor="shipmentId" className="block text-sm font-medium text-gray-700">
                货物选择
              </label>
              <select
                id="shipmentId"
                name="shipmentId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              >
                <option value="">请选择货物</option>
                <option value="1">NY250201-1 (ID: 1)</option>
                <option value="2">NY250201-1 (ID: 2)</option>
                <option value="3">NY250201-1 (ID: 3)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                <Link href="/shipments/new" className="text-purple-600 hover:text-purple-500">
                  没有找到？添加新货物
                </Link>
              </p>
            </div>

            <div className="col-span-1">
              <label htmlFor="inboundDate" className="block text-sm font-medium text-gray-700">
                入库日期
              </label>
              <input
                type="date"
                name="inboundDate"
                id="inboundDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

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
                    <p className="text-sm text-blue-700">入库费用计算规则：</p>
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

          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="text-lg font-medium text-gray-900">货物信息预览</h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">货物单号</dt>
                <dd className="mt-1 text-sm text-gray-900">NY250201-1</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">操作编号</dt>
                <dd className="mt-1 text-sm text-gray-900">6000</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">体积 (CBM)</dt>
                <dd className="mt-1 text-sm text-gray-900">0.04</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">重量</dt>
                <dd className="mt-1 text-sm text-gray-900">15.000 kg</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">尺寸</dt>
                <dd className="mt-1 text-sm text-gray-900">36.00 × 35.00 × 32.00 cm</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              确认入库
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 