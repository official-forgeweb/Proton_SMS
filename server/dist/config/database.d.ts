import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<{
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
    var prismaConnected: boolean | undefined;
}
declare const prisma: PrismaClient<{
    log: ("warn" | "error")[];
}, "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
export declare const connectDB: () => Promise<void>;
export declare const disconnectDB: () => Promise<void>;
export default prisma;
//# sourceMappingURL=database.d.ts.map