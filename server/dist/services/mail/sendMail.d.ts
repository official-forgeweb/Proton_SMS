import EventEmitter from 'events';
import { templates } from './templates';
export declare const mailEventEmitter: EventEmitter<[never]>;
interface MailPayload {
    recipientEmail: string;
    type: keyof typeof templates;
    data: any;
    uniqueDeduplicationId?: string;
}
/**
 * Core Operational Mail Sender.
 * Runs asynchronously and never blocks main ERP execution flows.
 */
export declare const sendOperationMail: (payload: MailPayload) => Promise<void>;
export {};
//# sourceMappingURL=sendMail.d.ts.map