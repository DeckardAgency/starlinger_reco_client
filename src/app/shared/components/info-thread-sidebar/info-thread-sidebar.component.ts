import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    InquiryMachinePart,
    InquiryPartInfoRequest,
    InquiryPartInfoMessage,
    MediaItem
} from '@models/manual-entry.model';
import { environment } from '@env/environment';
import { DateFilterPipe } from '@shared/pipes/date-filter.pipe';
import { INFO_REQUEST_TEMPLATES, ResponseTemplate } from '@shared/components/modals/info-request-modal/info-request-modal.component';

export interface TimelineEvent {
    type: 'created' | 'message' | 'status_change';
    timestamp: string;
    title: string;
    description?: string;
    actor?: string;
    actorType?: 'admin' | 'client' | 'system';
    status?: string;
    hasAttachments?: boolean;
    attachmentCount?: number;
}

export interface ThreadAction {
    type: 'accept' | 'request_more' | 'send_message';
    infoRequest: InquiryPartInfoRequest;
    messageText?: string;
    attachments?: string[];
}

@Component({
    selector: 'app-info-thread-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule, DateFilterPipe],
    templateUrl: './info-thread-sidebar.component.html',
    styleUrls: ['./info-thread-sidebar.component.scss']
})
// Note: TitleCasePipe is part of CommonModule
export class InfoThreadSidebarComponent implements OnChanges {
    @Input() isOpen: boolean = false;
    @Input() part: InquiryMachinePart | null = null;
    @Input() infoRequest: InquiryPartInfoRequest | null = null;
    @Input() loading: boolean = false;
    @Input() saving: boolean = false;

    @Output() closeSidebar = new EventEmitter<void>();
    @Output() threadAction = new EventEmitter<ThreadAction>();
    @Output() loadRequest = new EventEmitter<string>();

    replyText: string = '';
    uploadedFiles: MediaItem[] = [];

    // Response templates
    templates = INFO_REQUEST_TEMPLATES;
    showTemplateDropdown: boolean = false;

    // View mode: 'messages' or 'timeline'
    viewMode: 'messages' | 'timeline' = 'messages';

    ngOnChanges(changes: SimpleChanges): void {
        // Reset reply form when sidebar opens with new request
        if (changes['infoRequest'] && this.infoRequest) {
            this.resetReplyForm();
            this.viewMode = 'messages'; // Reset to messages view
        }
    }

    /**
     * Build activity timeline from info request data
     */
    buildTimeline(): TimelineEvent[] {
        if (!this.infoRequest) return [];

        const events: TimelineEvent[] = [];

        // 1. Request created event
        events.push({
            type: 'created',
            timestamp: this.infoRequest.createdAt,
            title: 'Information request created',
            actor: this.infoRequest.createdBy
                ? `${this.infoRequest.createdBy.firstName} ${this.infoRequest.createdBy.lastName}`
                : 'Admin',
            actorType: 'admin',
            status: 'pending'
        });

        // 2. Process messages and infer status changes
        let previousSenderType: string | null = null;

        if (this.infoRequest.messages) {
            this.infoRequest.messages.forEach((message, index) => {
                const isFirstMessage = index === 0;
                const senderName = message.sender
                    ? `${message.sender.firstName} ${message.sender.lastName}`
                    : (message.senderType === 'admin' ? 'Admin' : 'Client');

                // Add message event
                events.push({
                    type: 'message',
                    timestamp: message.createdAt,
                    title: message.senderType === 'admin' ? 'Admin sent a message' : 'Client responded',
                    description: this.truncateText(message.messageText, 100),
                    actor: senderName,
                    actorType: message.senderType as 'admin' | 'client',
                    hasAttachments: message.mediaItems && message.mediaItems.length > 0,
                    attachmentCount: message.mediaItems?.length || 0
                });

                // Infer status changes from message patterns
                if (!isFirstMessage) {
                    // If client responds after admin message, status changed to "responded"
                    if (message.senderType === 'client' && previousSenderType === 'admin') {
                        events.push({
                            type: 'status_change',
                            timestamp: message.createdAt,
                            title: 'Status changed to Responded',
                            actorType: 'system',
                            status: 'responded'
                        });
                    }
                    // If admin sends message after client, could be revision request
                    else if (message.senderType === 'admin' && previousSenderType === 'client') {
                        // Check if this is a revision request by looking at next status or message context
                        const messageWords = message.messageText.toLowerCase();
                        if (messageWords.includes('please') || messageWords.includes('need') || messageWords.includes('provide')) {
                            events.push({
                                type: 'status_change',
                                timestamp: message.createdAt,
                                title: 'Status changed to Needs Revision',
                                actorType: 'system',
                                status: 'needs_revision'
                            });
                        }
                    }
                }

                previousSenderType = message.senderType;
            });
        }

        // 3. Add final status if accepted
        if (this.infoRequest.status === 'accepted' && this.infoRequest.updatedAt) {
            events.push({
                type: 'status_change',
                timestamp: this.infoRequest.updatedAt,
                title: 'Information accepted',
                actorType: 'system',
                status: 'accepted'
            });
        }

        // Sort by timestamp
        events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return events;
    }

    private truncateText(text: string, maxLength: number): string {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'messages' ? 'timeline' : 'messages';
    }

    resetReplyForm(): void {
        this.replyText = '';
        this.uploadedFiles = [];
        this.showTemplateDropdown = false;
    }

    toggleTemplateDropdown(): void {
        this.showTemplateDropdown = !this.showTemplateDropdown;
    }

    selectTemplate(template: ResponseTemplate): void {
        if (this.replyText.trim()) {
            // Append to existing text with line break
            this.replyText = this.replyText.trim() + '\n\n' + template.text;
        } else {
            this.replyText = template.text;
        }
        this.showTemplateDropdown = false;
    }

    onClose(): void {
        if (!this.saving) {
            this.closeSidebar.emit();
        }
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('sidebar-backdrop')) {
            this.onClose();
        }
    }

    onAccept(): void {
        if (!this.infoRequest || this.saving) return;

        this.threadAction.emit({
            type: 'accept',
            infoRequest: this.infoRequest
        });
    }

    onRequestMore(): void {
        if (!this.infoRequest || this.saving || !this.replyText.trim()) return;

        this.threadAction.emit({
            type: 'request_more',
            infoRequest: this.infoRequest,
            messageText: this.replyText.trim(),
            attachments: this.uploadedFiles.map(f => f['@id'] || `/api/v1/media-items/${f.id}`)
        });
    }

    onSendMessage(): void {
        if (!this.infoRequest || this.saving || !this.replyText.trim()) return;

        this.threadAction.emit({
            type: 'send_message',
            infoRequest: this.infoRequest,
            messageText: this.replyText.trim(),
            attachments: this.uploadedFiles.map(f => f['@id'] || `/api/v1/media-items/${f.id}`)
        });
    }

    getFileUrl(mediaItem: MediaItem): string {
        return `${environment.apiBaseUrl}${mediaItem.filePath}`;
    }

    isImageFile(filename: string): boolean {
        const extension = filename.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
    }

    downloadFile(mediaItem: MediaItem): void {
        const link = document.createElement('a');
        link.href = this.getFileUrl(mediaItem);
        link.download = mediaItem.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    get showAcceptButton(): boolean {
        return this.infoRequest?.status === 'responded';
    }

    get showRequestMoreButton(): boolean {
        return this.infoRequest?.status === 'responded';
    }

    get canSendReply(): boolean {
        return this.replyText.trim().length > 0 && !this.saving;
    }

    get statusLabel(): string {
        switch (this.infoRequest?.status) {
            case 'pending': return 'Awaiting Client Response';
            case 'responded': return 'Client Responded - Review Required';
            case 'accepted': return 'Information Accepted';
            case 'needs_revision': return 'Revision Requested';
            default: return 'Unknown Status';
        }
    }

    get statusClass(): string {
        switch (this.infoRequest?.status) {
            case 'pending': return 'status--pending';
            case 'responded': return 'status--responded';
            case 'accepted': return 'status--accepted';
            case 'needs_revision': return 'status--revision';
            default: return '';
        }
    }

    getSenderName(message: InquiryPartInfoMessage): string {
        if (message.sender) {
            return `${message.sender.firstName} ${message.sender.lastName}`;
        }
        return message.senderType === 'admin' ? 'Admin' : 'Client';
    }

    getSenderInitials(message: InquiryPartInfoMessage): string {
        if (message.sender) {
            return `${message.sender.firstName?.charAt(0) || ''}${message.sender.lastName?.charAt(0) || ''}`.toUpperCase();
        }
        return message.senderType === 'admin' ? 'A' : 'C';
    }
}
