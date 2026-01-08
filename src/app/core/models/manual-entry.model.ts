import { PaginationLinks } from '@models/pagination.model';

export interface MediaItem {
    '@id': string;
    id: string;
    filename: string;
    mimeType: string;
    filePath: string;
}

// Part Info Status enum
export type PartInfoStatus = 'none' | 'clear' | 'pending_info' | 'info_provided';

// Info Request Status enum
export type InfoRequestStatus = 'pending' | 'responded' | 'accepted' | 'needs_revision';

// Sender Type enum
export type SenderType = 'admin' | 'client';

export interface InquiryPartInfoMessage {
    '@id': string;
    '@type'?: string;
    id: string;
    sender?: User;
    senderType: SenderType;
    messageText: string;
    createdAt: string;
    mediaItems?: MediaItem[];
    attachmentCount?: number;
}

export interface InquiryPartInfoRequest {
    '@id': string;
    '@type'?: string;
    id: string;
    inquiry?: string; // IRI reference
    inquiryMachinePart?: InquiryMachinePart;
    status: InfoRequestStatus;
    createdBy?: User;
    createdAt: string;
    updatedAt?: string;
    messages?: InquiryPartInfoMessage[];
    messageCount?: number;
}

export interface InquiryMachinePart {
    '@id': string;
    '@type': string;
    id: string;
    partName: string;
    partNumber: string;
    shortDescription: string;
    additionalNotes: string;
    createdAt: string;
    updatedAt: string;
    infoStatus?: PartInfoStatus;
    infoRequests?: InquiryPartInfoRequest[];
    mediaItems?: MediaItem[];
}

export interface Machine {
    '@id': string;
    '@type': string;
    ibStationNumber: number;
    ibSerialNumber: number;
    articleNumber: string;
    articleDescription: string;
    orderNumber: string;
    kmsIdentificationNumber: string;
    kmsIdNumber: string;
    mcNumber: string;
    fiStationNumber: number;
    fiSerialNumber: number;
}

export interface InquiryMachine {
    '@id': string;
    '@type': string;
    id: string;
    machine: Machine | null;
    customMachineId?: string | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
    products: InquiryMachinePart[];
    mediaItems?: MediaItem[];
}

export interface InquiryClient {
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isArchived: boolean;
}

export interface User {
    '@id': string;
    '@type': string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    client?: InquiryClient;
}

export interface InquiryLog {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: string;
    previousStatus: string;
    newStatus: string;
    comment: string;
    createdAt: string;
}

export interface Inquiry {
    '@id': string;
    '@type': string;
    id: string;
    inquiryNumber: string;
    status: string;
    notes: string;
    contactEmail: string;
    contactPhone: string;
    createdAt: string;
    updatedAt: string;
    lastSavedAt: string;
    user: User;
    machines: InquiryMachine[];
    logs?: InquiryLog[];
    partInfoRequests?: InquiryPartInfoRequest[];
    pendingInfoRequestCount?: number;
    // Cancellation fields
    cancellationReason?: string;
    cancelledAt?: string;
    cancelledBy?: User;
}

export interface InquiriesResponse {
    '@context': string;
    '@id': string;
    '@type': string;
    totalItems: number;
    member: Inquiry[];
    view?: {
        '@id': string;
        '@type': string;
        'first'?: string;
        'last'?: string;
        'next'?: string;
        'previous'?: string;
    };
    search?: {
        '@type': string;
        template: string;
        variableRepresentation: string;
        mapping: Array<{
            '@type': string;
            variable: string;
            property: string;
            required: boolean;
        }>;
    };
}

export interface TransformedInquiriesResponse {
    inquiries: Inquiry[];
    totalInquiries: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}
