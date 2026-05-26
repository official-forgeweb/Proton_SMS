"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error route catch:', err.message || err);
    // Connection errors
    if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        res.status(503).json({ success: false, message: 'Database disconnected. Retrying...' });
        return;
    }
    // Not Found
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Record not found' });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({ success: false, message: 'Record already exists / Conflict' });
            return;
        }
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map