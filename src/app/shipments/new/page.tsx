export default function NewShipmentPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">添加新货物</h1>
        <p className="mt-2 text-gray-600">填写货物基本信息</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action="#" method="POST">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="col-span-1">
              <label htmlFor="shipmentNumber" className="block text-sm font-medium text-gray-700">
                货物单号
              </label>
              <input
                type="text"
                name="shipmentNumber"
                id="shipmentNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="例如: NY250201-1"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="operationNumber" className="block text-sm font-medium text-gray-700">
                操作编号
              </label>
              <input
                type="text"
                name="operationNumber"
                id="operationNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="例如: 6000"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="materialTypeCode" className="block text-sm font-medium text-gray-700">
                材料类型代码
              </label>
              <input
                type="text"
                name="materialTypeCode"
                id="materialTypeCode"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                数量
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                defaultValue={1}
                min={1}
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="actualWeight" className="block text-sm font-medium text-gray-700">
                实际重量 (kg)
              </label>
              <input
                type="number"
                name="actualWeight"
                id="actualWeight"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.001"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="materialWeight" className="block text-sm font-medium text-gray-700">
                材料重量 (kg)
              </label>
              <input
                type="number"
                name="materialWeight"
                id="materialWeight"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.001"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="length" className="block text-sm font-medium text-gray-700">
                长度 (cm)
              </label>
              <input
                type="number"
                name="length"
                id="length"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.01"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                宽度 (cm)
              </label>
              <input
                type="number"
                name="width"
                id="width"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.01"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                高度 (cm)
              </label>
              <input
                type="number"
                name="height"
                id="height"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.01"
                required
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="cbm" className="block text-sm font-medium text-gray-700">
                体积 (CBM)
              </label>
              <input
                type="number"
                name="cbm"
                id="cbm"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                step="0.01"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">体积会根据长宽高自动计算</p>
            </div>

            <div className="col-span-1">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                目的地
              </label>
              <input
                type="text"
                name="destination"
                id="destination"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="route" className="block text-sm font-medium text-gray-700">
                路线
              </label>
              <input
                type="text"
                name="route"
                id="route"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                name="remarks"
                id="remarks"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              ></textarea>
            </div>
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
              保存
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 