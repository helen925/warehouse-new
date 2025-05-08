# Vercel部署指南

## 部署前准备

1. 确保所有代码已提交并推送到GitHub仓库

2. 在Vercel上创建一个新项目，关联GitHub仓库

## 环境变量设置

部署到Vercel时，需要在项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|------|------|------|
| `POSTGRES_URL` | 数据库连接URL(带连接池) | `postgres://user:password@host:port/database` |
| `POSTGRES_URL_NON_POOLING` | 数据库连接URL(不带连接池) | `postgresql://user:password@host:port/database` |
| `POSTGRES_USER` | 数据库用户名 | `neondb_owner` |
| `POSTGRES_HOST` | 数据库主机地址 | `ep-example.us-east-1.aws.neon.tech` |
| `POSTGRES_PASSWORD` | 数据库密码 | `your-password` |
| `POSTGRES_DATABASE` | 数据库名称 | `neondb` |

## 常见问题与解决方案

### 依赖冲突

如果遇到类似以下错误：

```
npm error ERESOLVE could not resolve
npm error While resolving: drizzle-orm@0.43.1
npm error Found: @neondatabase/serverless@0.9.5
...
npm error peerOptional @neondatabase/serverless@">=0.10.0" from drizzle-orm@0.43.1
```

解决方法：更新package.json中的@neondatabase/serverless依赖版本到^0.10.0或更高版本。

### 环境变量错误

如果遇到以下错误：

```
Invalid environment variables: [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'POSTGRES_URL_NON_POOLING' ],
    message: 'Required'
  }
]
```

解决方法：在Vercel项目设置中确保添加了所有必需的环境变量。

## 部署步骤

1. 在Vercel仪表板中，选择"Add New"→"Project"
2. 导入GitHub仓库
3. 配置项目，填写名称和环境变量
4. 点击"Deploy"开始部署

部署完成后，Vercel会提供一个可访问的URL，即可通过该URL访问应用。 