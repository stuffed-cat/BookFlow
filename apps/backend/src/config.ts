import dotenv from 'dotenv';

dotenv.config();

export type MigrationFlags = {
  books: boolean;
  pages: boolean;
  comments: boolean;
};

export interface AppConfig {
  port: number;
  legacyBaseUrl: string;
  databaseUrl?: string;
  corsOrigin?: boolean | string | RegExp | Array<string | RegExp>;
  initialFlags: MigrationFlags;
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3001);
  const legacyBaseUrl = process.env.LEGACY_BASE_URL ?? 'http://localhost:8081';
  const databaseUrl = process.env.DATABASE_URL;
  const initialFlags: MigrationFlags = {
    // 默认 books 已迁移，其他未迁移
    books: process.env.FLAG_BOOKS ? process.env.FLAG_BOOKS === 'true' : true,
    pages: process.env.FLAG_PAGES === 'true',
    comments: process.env.FLAG_COMMENTS === 'true',
  };
  return {
    port,
    legacyBaseUrl,
    databaseUrl,
    corsOrigin: true,
    initialFlags,
  };
}
