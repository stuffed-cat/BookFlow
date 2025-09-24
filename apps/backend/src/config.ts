import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Ensure .env is loaded relative to this module location (apps/backend/.env)
(() => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const envPath = path.resolve(__dirname, '../.env');
        dotenv.config({ path: envPath });
        // Fallback to CWD if not found
        dotenv.config();
    } catch {
        // As a last resort, rely on process env only
    }
})();

export type MigrationFlags = {
    books: boolean;
    pages: boolean;
    comments: boolean;
};

export interface AppConfig {
    port: number;
    bookstackBaseUrl: string;
    databaseUrl?: string;
    corsOrigin?: boolean | string | RegExp | Array<string | RegExp>;
}

export function loadConfig(): AppConfig {
    const port = Number(process.env.PORT ?? 3001);
    const bookstackBaseUrl = process.env.BOOKSTACK_BASE_URL ?? 'http://localhost:8081';
    const databaseUrl = process.env.DATABASE_URL;
    // Enforce using local binary engine and turn off Data Proxy
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
    process.env.PRISMA_CLIENT_DATAPROXY = 'false';
    process.env.PRISMA_GENERATE_DATAPROXY = 'false';
    return {
        port,
        bookstackBaseUrl,
        databaseUrl,
        corsOrigin: true,
    };
}
