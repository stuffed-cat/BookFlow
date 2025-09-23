# BookFlow Monorepo

## BookFlow 是什么
采用 TypeScript 重写的高性能、极速 BookStack —— 基于 Vue 3 + Fastify + Prisma + PostgreSQL 构建，专为速度、扩展性与现代化开发体验而生。
当前在一阶段开发

## 规划
###  架构图
```text
+------------------------------------------------------------------+
|                        CLIENT (Browser)                          |
|                                                                  |
|  ┌──────────────────────┐                                        |
|  │      Vue 3 SPA       │ ← 所有路由由 Vue Router 管理             |
|  │  (Vite / CDN)        │   - /books/123                         |
|  └──────────┬───────────┘   - /pages/456                         |
+-------------│----------------------------------------------------+
              │ (HTTPS)
+-------------▼----------------------------------------------------+
|                    NGINX / LOAD BALANCER                         |
|  - SSL Termination                                               |
|  - Forward all / → Fastify (except static assets)                |
+-------------┬----------------------------------------------------+
              │
+-------------▼---------------------------------------------------+
|                    FASTIFY GATEWAY (Single Entry)               |
|                                                                 |
|  ┌───────────────────────────────────────────────────────────┐  |
|  │                ROUTE DISPATCH STRATEGY                    │  |
|  ├───────────────────────────────────────────────────────────┤  |
|  │ /books/*     → if "books" module migrated → New Books API │  |
|  │               else → Proxy to BookStack (temporarily)     │  |
|  │                                                           │  |
|  │ /pages/*     → if "pages" module migrated → New Pages API │  |
|  │               else → Proxy to BookStack                   │  |
|  │                                                           │  |
|  │ /search      → Always New Search API (PG Full-Text)       │  |
|  │ /auth        → Unified Auth (JWT)                         │  |
|  └───────────────┬───────────────────────────────────────────┘  |
|                  │                                              |
|  ┌───────────────▼───────────────────────────────────────────┐  |
|  │              MODULE MIGRATION FLAG SYSTEM                 │  |
|  │  - Config: { books: true, pages: false, comments: false } │  |
|  │  - Can be updated at runtime (e.g., via admin API)        │  |
|  └───────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------+
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
+----------+           +---------------------------+
|  NEW     |           |  LEGACY                   |
|  TS API  |           |  BookStack (PHP)          |
+----------+           +---------------------------+
| • Books  | ◄─Proxy───| • Books (if not migrated) |
| • Pages  |           | • Pages                   |
| • Search |           | • Auth (fallback)         |
+----------+           +---------------------------+
     │                         │
     ▼                         ▼
+-----------+           +------------------+
| PostgreSQL|           | MySQL (BookStack)|
+-----------+           +------------------+
     ▲
     │
+----┴-----------------------------+
|    DATA MIGRATION PIPELINE       |
|                                  |
| 1. Pre-migration script:         |
|    - Dump MySQL.books → CSV/JSON |
|    - Transform schema            |
|    - Load into PG.books          |
|                                  |
| 2. Cutover:                      |
|    - Set migration flag = true   |
|    - Stop writes to MySQL.books  |
|    - Redirect all /books/* to TS |
|                                  |
| 3. Post-migration:               |
|    - Verify data consistency     |
|    - Archive MySQL.books         |
+----------------------------------+
```
### 一阶段
    
    - 完成WorkHorse
    - 代理php BookStack并缓存静态资源

### 二阶段
    
    - 完成部分API设计并成功对接
    - 实现用户认证
    - 把部分数据从MySQL迁移到PostgreSQL

### 三阶段

    - 完成前端页面开发
    - 实现前后端联调
    - 完全替换PHP BookStack


## Monorepo 结构
Monorepo 包含：
- Backend: TypeScript + Fastify + Prisma + PostgreSQL
- Frontend: Vite + Vue 3

## 快速开始

- 安装依赖（使用 npm workspaces）：

```bash
npm install
```

- 启动开发：

```bash
npm run dev
```

- 仅后端：

```bash
npm run dev:backend
```

- 仅前端：

```bash
npm run dev:frontend
```

## 环境变量

- Backend 环境变量见 `apps/backend/.env.example`

## 数据库迁移

```bash
npm run prisma:migrate
```

## 使用 Docker（可选）

```bash
docker compose up -d --build
```

- Postgres: localhost:5432（用户/密码：postgres/postgres，库：bookflow）
- Adminer: http://localhost:8080
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 许可

MIT
