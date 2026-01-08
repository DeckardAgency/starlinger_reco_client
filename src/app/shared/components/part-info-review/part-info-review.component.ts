import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    InquiryMachine,
    InquiryMachinePart,
    InquiryPartInfoRequest,
    PartInfoStatus
} from '@models/manual-entry.model';

export interface PartInfoAction {
    type: 'mark_clear' | 'request_info' | 'view_thread' | 'accept' | 'request_more';
    part: InquiryMachinePart;
    machine: InquiryMachine;
    infoRequest?: InquiryPartInfoRequest;
}

@Component({
    selector: 'app-part-info-review',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './part-info-review.component.html',
    styleUrls: ['./part-info-review.component.scss']
})
export class PartInfoReviewComponent {
    @Input() machines: InquiryMachine[] = [];
    @Input() isReadOnly: boolean = false;
    @Input() showStatusColumn: boolean = true;

    @Output() partAction = new EventEmitter<PartInfoAction>();

    /**
     * Get the display status for a part
     */
    getPartStatusDisplay(part: InquiryMachinePart): { label: string; class: string } {
        const status = part.infoStatus || 'none';
        const latestRequest = this.getLatestPendingRequest(part);

        switch (status) {
            case 'clear':
                return { label: 'Clear', class: 'status--clear' };
            case 'pending_info':
                return { label: 'Pending Info', class: 'status--pending' };
            case 'info_provided':
                if (latestRequest?.status === 'responded') {
                    return { label: 'Responded', class: 'status--responded' };
                }
                return { label: 'Info Provided', class: 'status--provided' };
            default:
                return { label: 'Not Reviewed', class: 'status--none' };
        }
    }

    /**
     * Get the latest pending or responded info request for a part
     */
    getLatestPendingRequest(part: InquiryMachinePart): InquiryPartInfoRequest | undefined {
        if (!part.infoRequests || part.infoRequests.length === 0) {
            return undefined;
        }

        // Find the latest non-accepted request
        return part.infoRequests.find(req =>
            req.status === 'pending' ||
            req.status === 'responded' ||
            req.status === 'needs_revision'
        );
    }

    /**
     * Check if part has any info request activity
     */
    hasInfoRequestActivity(part: InquiryMachinePart): boolean {
        return (part.infoRequests?.length || 0) > 0;
    }

    /**
     * Get the total message count for a part
     */
    getTotalMessageCount(part: InquiryMachinePart): number {
        if (!part.infoRequests) return 0;
        return part.infoRequests.reduce((total, req) => total + (req.messageCount || req.messages?.length || 0), 0);
    }

    /**
     * Mark a part as clear (no info needed)
     */
    onMarkClear(part: InquiryMachinePart, machine: InquiryMachine): void {
        this.partAction.emit({
            type: 'mark_clear',
            part,
            machine
        });
    }

    /**
     * Request info for a part
     */
    onRequestInfo(part: InquiryMachinePart, machine: InquiryMachine): void {
        this.partAction.emit({
            type: 'request_info',
            part,
            machine
        });
    }

    /**
     * View the thread for a part's info request
     */
    onViewThread(part: InquiryMachinePart, machine: InquiryMachine): void {
        // Get any info request (including accepted ones) for viewing history
        const infoRequest = this.getLatestPendingRequest(part) || this.getLatestInfoRequest(part);
        this.partAction.emit({
            type: 'view_thread',
            part,
            machine,
            infoRequest
        });
    }

    /**
     * Get the latest info request regardless of status (for viewing history)
     */
    getLatestInfoRequest(part: InquiryMachinePart): InquiryPartInfoRequest | undefined {
        if (!part.infoRequests || part.infoRequests.length === 0) {
            return undefined;
        }
        // Return the most recent info request
        return part.infoRequests[part.infoRequests.length - 1];
    }

    /**
     * Accept the info provided
     */
    onAcceptInfo(part: InquiryMachinePart, machine: InquiryMachine): void {
        const infoRequest = this.getLatestPendingRequest(part);
        this.partAction.emit({
            type: 'accept',
            part,
            machine,
            infoRequest
        });
    }

    /**
     * Request more info (needs revision)
     */
    onRequestMore(part: InquiryMachinePart, machine: InquiryMachine): void {
        const infoRequest = this.getLatestPendingRequest(part);
        this.partAction.emit({
            type: 'request_more',
            part,
            machine,
            infoRequest
        });
    }

    /**
     * Count parts by status across all machines
     */
    getStatusCounts(): { clear: number; pending: number; responded: number; total: number } {
        let clear = 0;
        let pending = 0;
        let responded = 0;
        let total = 0;

        for (const machine of this.machines) {
            for (const part of machine.products) {
                total++;
                const status = part.infoStatus || 'none';
                if (status === 'clear') {
                    clear++;
                } else if (status === 'pending_info') {
                    pending++;
                } else if (status === 'info_provided') {
                    const latestRequest = this.getLatestPendingRequest(part);
                    if (latestRequest?.status === 'responded') {
                        responded++;
                    }
                }
            }
        }

        return { clear, pending, responded, total };
    }

    /**
     * Check if a part can be marked as clear
     */
    canMarkClear(part: InquiryMachinePart): boolean {
        if (this.isReadOnly) return false;
        const status = part.infoStatus || 'none';
        // Can mark clear if status is none, or if there's a responded info request
        return status === 'none' || (status === 'info_provided' && this.getLatestPendingRequest(part)?.status === 'responded');
    }

    /**
     * Check if info can be requested for a part
     */
    canRequestInfo(part: InquiryMachinePart): boolean {
        if (this.isReadOnly) return false;
        const status = part.infoStatus || 'none';
        // Can request info if status is none or clear
        return status === 'none' || status === 'clear';
    }

    /**
     * Check if the thread can be viewed
     */
    canViewThread(part: InquiryMachinePart): boolean {
        return this.hasInfoRequestActivity(part);
    }

    /**
     * Check if part is waiting for admin action (responded status)
     */
    isAwaitingAdminAction(part: InquiryMachinePart): boolean {
        const latestRequest = this.getLatestPendingRequest(part);
        return latestRequest?.status === 'responded';
    }
}
