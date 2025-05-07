/**
 * 仓储费用计算器
 * 规则：
 * - 7天内免费
 * - 7-30天内：1 USD/CBM/天
 * - 30天以上：2 USD/CBM/天
 * - 阶梯式计算
 */

export type FeeBreakdown = {
  freeDaysFee: number;
  standardDaysFee: number;
  extendedDaysFee: number;
  totalFee: number;
  details: {
    freeDays: number;
    standardDays: number;
    extendedDays: number;
    cbm: number;
    standardRate: number;
    extendedRate: number;
  };
};

/**
 * 计算仓储费用
 * @param inboundDate 入库日期 
 * @param outboundDate 出库日期，如果为空则使用当前日期
 * @param cbm 货物体积（立方米）
 * @param freeDays 免费天数（默认为7天）
 * @param standardRate 标准费率（默认为1 USD/CBM/天）
 * @param extendedRate 超期费率（默认为2 USD/CBM/天）
 * @param standardDaysLimit 标准费率天数上限（默认为30天）
 * @returns 费用明细
 */
export function calculateStorageFee(
  inboundDate: Date,
  outboundDate: Date | null = null,
  cbm: number,
  freeDays: number = 7,
  standardRate: number = 1,
  extendedRate: number = 2,
  standardDaysLimit: number = 30
): FeeBreakdown {
  // 如果没有出库日期，使用当前日期
  const endDate = outboundDate || new Date();
  
  // 计算存储天数
  const storageDays = Math.ceil(
    (endDate.getTime() - inboundDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // 计算各个阶段的天数
  const actualFreeDays = Math.min(storageDays, freeDays);
  const actualStandardDays = storageDays > freeDays 
    ? Math.min(storageDays - freeDays, standardDaysLimit - freeDays) 
    : 0;
  const actualExtendedDays = storageDays > standardDaysLimit 
    ? storageDays - standardDaysLimit 
    : 0;
  
  // 计算各阶段费用
  const freeDaysFee = 0; // 免费期
  const standardDaysFee = actualStandardDays * standardRate * cbm;
  const extendedDaysFee = actualExtendedDays * extendedRate * cbm;
  
  // 总费用
  const totalFee = freeDaysFee + standardDaysFee + extendedDaysFee;
  
  return {
    freeDaysFee,
    standardDaysFee,
    extendedDaysFee,
    totalFee,
    details: {
      freeDays: actualFreeDays,
      standardDays: actualStandardDays,
      extendedDays: actualExtendedDays,
      cbm,
      standardRate,
      extendedRate
    }
  };
}

/**
 * 获取存储天数
 * @param inboundDate 入库日期
 * @param outboundDate 出库日期，如果为空则使用当前日期
 * @returns 存储天数
 */
export function getStorageDays(
  inboundDate: Date,
  outboundDate: Date | null = null
): number {
  const endDate = outboundDate || new Date();
  return Math.ceil(
    (endDate.getTime() - inboundDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * 格式化金额为USD字符串
 * @param amount 金额
 * @returns 格式化后的字符串
 */
export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} USD`;
}

/**
 * 计算体积（CBM）
 * @param length 长度（厘米）
 * @param width 宽度（厘米）
 * @param height 高度（厘米）
 * @returns 体积（立方米）
 */
export function calculateCBM(
  length: number,
  width: number,
  height: number
): number {
  return (length * width * height) / 1000000; // 厘米转立方米
} 