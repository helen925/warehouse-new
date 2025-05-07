# 仓库管理系统

一个简易的仓库管理系统，用于管理货物的入库、出库操作和仓储费用计算。

## 功能特点

- **货物管理**：记录和管理货物基本信息，包括尺寸、重量、CBM计算等
- **入库操作**：记录货物入库信息，自动分配库位和记录入库时间
- **出库操作**：记录货物出库信息，自动计算仓储费用
- **仓储费用计算**：基于阶梯式费率计算仓储费用
  - 7天内免费存储
  - 7-30天：1 USD/CBM/天
  - 30天以上：2 USD/CBM/天

## 技术栈

- **前端**：Next.js 15.3.2 + React + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes + tRPC
- **数据库**：Drizzle ORM + MySQL (可配置)
- **认证**：NextAuth.js (可选配置)

## 安装和运行

1. 克隆仓库

```bash
git clone https://github.com/helen925/warehouse-new.git
cd warehouse-new
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 文件为 `.env`，并根据需要修改配置

```bash
cp .env.example .env
```

4. 启动开发服务器

```bash
npm run dev
```

5. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 部署

项目可以部署到任何支持 Next.js 的平台，如 Vercel、Netlify 或自托管服务器。

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhelen925%2Fwarehouse-new)

## 开发计划

- [ ] 用户认证和权限管理
- [ ] 导出报表功能（Excel、PDF）
- [ ] 库存预警功能
- [ ] 移动端优化
- [ ] 多语言支持

## 许可证

[MIT](LICENSE)

## 贡献

欢迎提交问题和改进建议！
