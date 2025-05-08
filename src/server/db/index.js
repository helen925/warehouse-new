import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env.development.local');
if (fs.existsSync(envPath)) {
  console.log(`正在加载环境变量文件: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`环境变量文件不存在: ${envPath}`);
  console.log('正在尝试加载默认的 .env 文件');
  dotenv.config();
}

// 手动导入环境变量
const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING;

if (!POSTGRES_URL_NON_POOLING) {
  throw new Error('POSTGRES_URL_NON_POOLING环境变量未设置。请确保在.env.development.local中设置了此变量。');
}

// 输出连接信息
console.log('数据库连接字符串:', POSTGRES_URL_NON_POOLING.replace(/:[^:]*@/, ':***@'));

// 解析数据库连接字符串
const sql = neon(POSTGRES_URL_NON_POOLING);

// 创建Drizzle客户端
export const db = drizzle(sql); 