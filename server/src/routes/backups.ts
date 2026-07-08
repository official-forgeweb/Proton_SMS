import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// On Vercel (serverless), the filesystem is read-only except /tmp
const isVercel = !!process.env.VERCEL;
const BACKUP_DIR = isVercel
    ? path.join('/tmp', 'backups')
    : path.join(__dirname, '../../backups');

// Ensure backup directory exists (graceful – never crash the server on startup)
try {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
} catch (err) {
    console.warn('⚠️ Could not create backup directory:', (err as Error).message);
}

// 1. List existing backup files
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created_at: stats.mtime,
                };
            })
            // Sort by newest first
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

        res.json({ success: true, data: backups });
    } catch (error: any) {
        console.error('❌ Error listing backups:', error);
        res.status(500).json({ success: false, message: 'Failed to list backups: ' + error.message });
    }
});

// 2. Trigger database backup creation
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        // Query all public base tables (exclude views & migrations)
        const tables: { table_name: string }[] = await prisma.$queryRawUnsafe(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != '_prisma_migrations'`
        );

        const backupData: Record<string, any[]> = {};

        for (const table of tables) {
            const tableName = table.table_name;
            const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
            backupData[tableName] = rows;
        }

        const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const filename = `backup_${dateStr}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

        res.json({ 
            success: true, 
            message: 'Database backup created successfully', 
            data: { filename, created_at: new Date() } 
        });
    } catch (error: any) {
        console.error('❌ Error creating backup:', error);
        res.status(500).json({ success: false, message: 'Failed to create backup: ' + error.message });
    }
});

// 3. Download a backup file
router.get('/:filename', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const filename = req.params.filename as string;
        const filePath = path.resolve(BACKUP_DIR, filename);

        // Security check: ensure path is inside BACKUP_DIR
        if (!filePath.startsWith(BACKUP_DIR)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        res.download(filePath);
    } catch (error: any) {
        console.error('❌ Error downloading backup:', error);
        res.status(500).json({ success: false, message: 'Failed to download backup: ' + error.message });
    }
});

// 4. Restore database from backup file
router.post('/:filename/restore', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const filename = req.params.filename as string;
        const filePath = path.resolve(BACKUP_DIR, filename);

        // Security check
        if (!filePath.startsWith(BACKUP_DIR)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const backupData: Record<string, any[]> = JSON.parse(fileContent);

        // Run entire restore in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Temporarily disable all triggers (including foreign key checks)
            for (const tableName of Object.keys(backupData)) {
                await tx.$executeRawUnsafe(`ALTER TABLE "${tableName}" DISABLE TRIGGER ALL`);
            }

            // 2. Empty all tables inside the backup
            for (const tableName of Object.keys(backupData)) {
                await tx.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
            }

            // 3. Insert backup rows
            for (const [tableName, rows] of Object.entries(backupData)) {
                if (!rows || rows.length === 0) continue;

                for (const row of rows) {
                    const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
                    const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
                    
                    // Pre-process values (convert objects to JSON strings, keep arrays/primitives)
                    const values = Object.values(row).map(val => {
                        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                            return JSON.stringify(val);
                        }
                        return val;
                    });

                    await tx.$executeRawUnsafe(
                        `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`,
                        ...values
                    );
                }
            }

            // 4. Re-enable all triggers
            for (const tableName of Object.keys(backupData)) {
                await tx.$executeRawUnsafe(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL`);
            }
        });

        res.json({ success: true, message: 'Database restored successfully from ' + filename });
    } catch (error: any) {
        console.error('❌ Error restoring database:', error);
        res.status(500).json({ success: false, message: 'Failed to restore database: ' + error.message });
    }
});

// 5. Delete a backup file
router.delete('/:filename', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const filename = req.params.filename as string;
        const filePath = path.resolve(BACKUP_DIR, filename);

        // Security check
        if (!filePath.startsWith(BACKUP_DIR)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Backup file deleted successfully' });
    } catch (error: any) {
        console.error('❌ Error deleting backup:', error);
        res.status(500).json({ success: false, message: 'Failed to delete backup: ' + error.message });
    }
});

export default router;
