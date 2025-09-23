# BookFlow Monorepo

## BookFlow 是什么
采用 TypeScript 重写的高性能、极速 BookStack —— 基于 Vue 3 + Fastify + Prisma + PostgreSQL 构建，专为速度、扩展性与现代化开发体验而生。
当前在一阶段开发

## 规划
###  架构图
```text
+------------------------------------------------------------------------------------------------------------------+
|                                                     CLIENT (Browser)                                             |
|                                                                                                                  |
|  ┌──────────────────────┐        ┌───────────────────────────────────────────────────────────────────────────┐   |
|  │      Vue 3 SPA       │<──────>│                     Browser URL Routes                                    │   |
|  │  (Vite Dev / CDN)    │        │  /app/books/123  → 新前端 (Vue Router)                                     │   |
|  └──────────┬───────────┘        │  /legacy/books/123 → 旧系统 (BookStack)                                    │   |
|             │                    └───────────────────────────────────────────────────────────────────────────┘   |
|             │ (HTTPS)                                                                                            |
+-------------│----------------------------------------------------------------------------------------------------+
              ▼
+------------------------------------------------------------------------------------------------------------------+
|                                                EDGE / INGRESS LAYER                                              |
|                                                                                                                  |
|  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐   |
|  │                                           NGINX / CLOUD LOAD BALANCER                                     │   |
|  │  - SSL Termination (TLS 1.3)                                                                              │   |
|  │  - Rate Limiting                                                                                          │   |
|  │  - WAF Rules                                                                                              │   |
|  └───────────────┬───────────────────────────────────────────────────────────────────────────────────────────┘   |
|                  │ (HTTP/1.1 or HTTP/2)                                                                          |
+------------------│-----------------------------------------------------------------------------------------------+
                   ▼
+------------------------------------------------------------------------------------------------------------------+
|                                              FASTIFY GATEWAY (Node.js)                                           |
|  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐   |
|  │  Core Plugins:                                                                                            │   |
|  │  - @fastify/static    → Serve Vue SPA (fallback to index.html)                                            │   |
|  │  - @fastify/cors      → Enable CORS for dev                                                               │   |
|  │  - @fastify/sensible  → Standard error handling                                                           │   |
|  │  - Custom Auth Bridge → Translate PHP Session ↔ JWT (optional)                                            │   |
|  └───────────────┬───────────────────────────────────────────────────────────────────────────────────────────┘   |
|                  │                                                                                               |
|  ┌───────────────▼───────────────────────────────────────────────────────────────────────────────────────────┐   |
|  │                                     ROUTING & REQUEST HANDLING                                            │   |
|  ├───────────────────────────────────────────────────────────────────────────────────────────────────────────┤   |
|  │  /app/*                → Static Vue files (handled by @fastify/static)                                    │   |
|  │                                                                                                           │   |
|  │  /api/v1/books         → New Books API (TS Handler → PG)                                                  │   |
|  │  /api/v1/search        → New Search API (TS Handler → PG Full-Text)                                       │   |
|  │  ...                   → Other NEW endpoints                                                              │   |
|  │                                                                                                           │   |
|  │  /legacy/*             → Proxy to BookStack (via @fastify/http-proxy)                                     │   |
|  │                         - Rewrite path: /legacy/books/1 → /books/1                                        │   |
|  │                         - Forward cookies (PHPSESSID)                                                     │   |
|  │                         - Inject X-Forwarded-* headers                                                    │   |
|  └───────────────┬───────────────────────────────────────────────────────────────────────────────────────────┘   |
|                  │                                                                                               |
|  ┌───────────────▼───────────────────────────────────────────────────────────────────────────────────────────┐   |
|  │                                    OBSERVABILITY & SECURITY                                               │   |
|  │  - Logging: Pino → STDOUT → Loki/ELK                                                                      │   |
|  │  - Metrics: Prometheus client → /metrics                                                                  │   |
|  │  - Tracing: OpenTelemetry (optional)                                                                      │   |
|  │  - Error Tracking: Sentry                                                                                 │   |
|  └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘   |
+------------------------------------------------------------------------------------------------------------------+
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
+------------------+    +---------------------+
|   NEW SERVICES   |    |   LEGACY SYSTEM     |
| (TypeScript)     |    | (PHP - BookStack)   |
+------------------+    +---------------------+
|                  |    |                     |
|  ┌────────────┐  |    |  ┌───────────────┐  |
|  │  Books API │<─┼────┼──│  BookStack    │  |
|  └──────┬─────┘  |    |  │  (Laravel?)   │  |
|         │        |    |  └───────┬───────┘  |
|  ┌──────▼─────┐  |    |          │ (HTTP)   |
|  │ Search API │  |    |  ┌───────▼───────┐  |
|  └──────┬─────┘  |    |  │  PHP-FPM      │  |
|         │        |    |  └───────┬───────┘  |
|  ┌──────▼─────┐  |    |          │          |
|  │ Auth API   │  |    |  ┌───────▼───────┐  |
|  └────────────┘  |    |  │  MySQL        │  |
|                  |    |  │  (Original DB)│  |
+------------------+    |  └───────────────┘  |
                        +---------------------+
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
+------------------+    +---------------------+
|   NEW DATABASE   |    |   LEGACY DATABASE   |
| (PostgreSQL)     |    | (MySQL)             |
+------------------+    +---------------------+
|  - Tables:       |    |  - bookstack_*      |
|    • books       |    |  - users            |
|    • pages       |    |  - roles            |
|    • comments    |    |  - ...              |
|  - Features:     |    |                     |
|    • JSONB       |    |                     |
|    • Full-Text   |    |                     |
|    • Row-Level   |    |                     |
|      Security    |    |                     |
+------------------+    +---------------------+

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
