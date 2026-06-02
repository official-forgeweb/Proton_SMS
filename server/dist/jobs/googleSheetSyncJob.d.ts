/**
 * Highly Optimized, Production-grade Google Sheet Synchronizer
 */
export declare class GoogleSheetSyncJob {
    /**
     * Triggers the full database synchronization against the Google Sheet configuration.
     * Supports a `force` parameter to override the "google_sheets_enabled" toggle (for Manual Sync).
     */
    static sync(force?: boolean): Promise<any>;
}
//# sourceMappingURL=googleSheetSyncJob.d.ts.map