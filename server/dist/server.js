"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const store_1 = require("./data/store");
const env_1 = require("./config/env");
const PORT = env_1.env.PORT;
const startServer = async () => {
    // Execute DB connection and seeding in the background
    // so the HTTP server can start immediately, even if internet drops
    const dbInit = async () => {
        try {
            await (0, database_1.connectDB)();
            try {
                await (0, store_1.seedData)();
            }
            catch (err) {
                console.error('⚠️  Seed data failed (server will still start):', err instanceof Error ? err.message : err);
            }
        }
        catch (err) {
            console.error('⚠️ Database init failed in background:', err instanceof Error ? err.message : err);
        }
    };
    dbInit();
    const server = app_1.default.listen(PORT, () => {
        console.log(`\n🚀 Proton LMS Server running on port ${PORT}`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
        console.log(`\n📧 Demo Credentials:`);
        console.log(`   Admin: admin@protoncoaching.com / Admin@123`);
    });
    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} signal received: closing HTTP server`);
        try {
            await Promise.resolve().then(() => __importStar(require('./config/database'))).then((mod) => mod.disconnectDB());
            console.log('✅ Database connections closed.');
        }
        catch (err) {
            console.error('❌ Error during database disconnect:', err);
        }
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};
startServer();
//# sourceMappingURL=server.js.map