import dotenv from 'dotenv';

dotenv.config();

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
    return {
        port,
        bookstackBaseUrl,
        databaseUrl,
        corsOrigin: true,
    };
}
