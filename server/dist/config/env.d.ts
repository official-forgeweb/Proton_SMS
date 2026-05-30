interface EnvConfig {
    PORT: number;
    NODE_ENV: string;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    CLIENT_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    FROM_EMAIL: string;
    FROM_NAME: string;
    SMTP_FROM: string;
    APP_NAME: string;
    APP_URL: string;
    MAX_FILE_SIZE: number;
    UPLOAD_DIR: string;
}
export declare const env: EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map