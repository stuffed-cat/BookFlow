# BookFlow Monorepo

## BookFlow 是什么
采用 TypeScript 重写的高性能、极速 BookStack —— 基于 Vue 3 + Fastify + Prisma + PostgreSQL 构建，专为速度、扩展性与现代化开发体验而生。
当前在一阶段开发

## 规划
###  架构图
```text
+----------------------------------------------------------------------------------+
|                                   CLIENT (Browser)                               |
|                                                                                  |
|   Vue 3 SPA (Vite) ←───────────────┐                                             |
|                                    │                                             |
|   Requests:                        │                                             |
|     - /app/*      → New UI         │                                             |
|     - /api/v1/*   → New API        │                                             |
|     - /legacy/*   → Old BookStack  │                                             |
+-------------------↑----------------+                                             |
                    │ HTTP(S)                                                      |
+-------------------↓----------------+                                             |
|            FASTIFY GATEWAY (Node.js + TypeScript)                               |
|  +-------------------------------+  +-----------------------------------------+  |
|  │      STATIC FILE SERVING      │  │           ROUTE HANDLERS                │  |
|  │  (Serves Vue 3 SPA dist)      │  │                                         │  |
|  │  - GET /app/* → index.html    │  │  - GET  /api/v1/books     → PG Query    │  |
|  │  - GET /        → redirect    │  │  - POST /api/v1/pages     → PG Write    │  |
|  +-------------------------------+  │  - ... (New Features in TS)             │  |
|                                    +-----------------------------------------+  |
|  +------------------------------------------------------------------------------+  |
|  │                        LEGACY PROXY (to BookStack)                           │  |
|  │  - All /legacy/* requests                                                    │  |
|  │  - Forward cookies, headers, body                                            │  |
|  │  - Preserve PHP session & auth                                               │  |
|  │  → http://bookstack-php:80                                                   │  |
|  +------------------------------------------------------------------------------+  |
|  +------------------------------------------------------------------------------+  |
|  │                        MIDDLEWARE & SHARED LOGIC                             │  |
|  │  - Auth Bridge (Session ↔ Token)                                             │  |
|  │  - Request Logging / Metrics                                                 │  |
|  │  - Rate Limiting / CORS                                                      │  |
|  +------------------------------------------------------------------------------+  |
+-------------------↑----------------+                                             |
                    │                                                              |
        +-----------↓------------+       +------------------------------------+   |
        │   NEW DATABASE LAYER   │       │      LEGACY SYSTEM (BookStack)     │   |
        │                        │       │                                    │   |
        │  PostgreSQL (PG)       │       │  PHP 7.4+ / Laravel-like MVC       │   |
        │  - JSONB for content   │       │  - MySQL / MariaDB                 │   |
        │  - Full-text search    │       │  - Blade templates                 │   |
        │  - Row-level security  │       │  - Native PHP session/auth         │   |
        │  - Drizzle/Kysely ORM  │       │  - Monolithic codebase             │   |
        +------------------------+       +------------------------------------+   |
                    ↑                                                              |
                    │                                                              |
        +-----------┴------------+                                                 |
        │   DATA MIGRATION PIPE  │ ← (Optional: one-time or incremental sync)     |
        │  - ETL scripts         │                                                 |
        │  - Dual-read fallback  │                                                 |
        +------------------------+                                                 |
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