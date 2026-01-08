import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, tap, switchMap, map } from 'rxjs';
import {
    Inquiry,
    InquiriesResponse,
    TransformedInquiriesResponse,
    InquiryPartInfoRequest,
    InquiryPartInfoMessage,
    InquiryMachinePart,
    PartInfoStatus
} from '@models/manual-entry.model';
import {environment} from "@env/environment";

export interface CreateInfoRequestPayload {
    inquiry: string; // IRI reference like /api/v1/inquiries/{uuid}
    inquiryMachinePart: string; // IRI reference like /api/v1/inquiry_machine_parts/{uuid}
    initialMessage: string; // The initial message text requesting info
    attachments?: string[]; // IRI references to media items
}

export interface CreateInfoMessagePayload {
    messageText: string;
    senderType: 'admin' | 'client';
    attachments?: string[]; // IRI references to media items
}

@Injectable({
    providedIn: 'root'
})
export class ManualEntryService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/inquiries`;
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
    };

    constructor(private http: HttpClient) {}

    /**
     * Get inquiries with pagination, sorting and filtering
     */
    getInquiries(
        page: number = 1,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        searchParams: Record<string, string> = {},
        filters: { status?: string[], isDraft?: boolean } = {}
    ): Observable<TransformedInquiriesResponse> {
        let params = new HttpParams().set('page', page.toString());

        // Add sorting parameters
        if (sortField && sortDirection) {
            // Format as order[fieldName]=direction
            params = params.set(`order[${sortField}]`, sortDirection);
        }

        // Add search parameters
        if (searchParams['query']) {
            // If general search query is provided, search in inquiryNumber
            params = params.set('inquiryNumber', searchParams['query']);
        }

        // Add isDraft filter if provided
        if (filters.isDraft !== undefined) {
            params = params.set('isDraft', filters.isDraft.toString());
        }

        // Add status filters if provided
        if (filters.status && filters.status.length > 0) {
            filters.status.forEach(status => {
                params = params.append('status[]', status);
            });
        }

        // Add any other search parameters
        Object.keys(searchParams).forEach(key => {
            if (key !== 'query') { // Skip query as we've already handled it
                params = params.set(key, searchParams[key]);
            }
        });

        return this.http.get<InquiriesResponse>(this.apiUrl, { params }).pipe(
            tap(response => console.log('Raw API response:', response)),
            map(response => {
                // Transform the API response format to match what the component expects
                const inquiriesResponse: TransformedInquiriesResponse = {
                    inquiries: response.member || [],
                    totalInquiries: response.totalItems || 0,
                    pagination: {
                        first: response.view?.first,
                        last: response.view?.last,
                        next: response.view?.next,
                        previous: response.view?.previous
                    },
                    currentPage: page,
                    totalPages: this.extractTotalPages(response)
                };

                console.log('Transformed inquiries response:', inquiriesResponse);
                return inquiriesResponse;
            }),
            catchError(error => {
                console.error('API error:', error);
                // Return a valid empty response on error
                return of({
                    inquiries: [],
                    totalInquiries: 0,
                    pagination: {},
                    currentPage: page,
                    totalPages: 1
                });
            })
        );
    }

    /**
     * Get a single inquiry by ID
     */
    getInquiry(id: string): Observable<Inquiry> {
        return this.http.get<Inquiry>(`${this.apiUrl}/${id}`);
    }

    /**
     * Update an inquiry
     */
    updateInquiry(id: string, updateData: Partial<Inquiry>): Observable<Inquiry> {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        };

        return this.http.patch<Inquiry>(
            `${this.apiUrl}/${id}`,
            updateData,
            options
        ).pipe(
            tap(response => console.log('Inquiry updated:', response)),
            catchError(error => {
                console.error('Error updating inquiry:', error);
                throw error;
            })
        );
    }

    /**
     * Extract total pages from the response
     */
    private extractTotalPages(response: InquiriesResponse): number {
        // If view.last contains pagination info, try to extract page number
        if (response.view?.last) {
            const lastPageUrl = response.view.last;
            const pageMatch = lastPageUrl.match(/[?&]page=(\d+)/);
            if (pageMatch && pageMatch[1]) {
                return parseInt(pageMatch[1], 10);
            }
        }
        // Fallback: If we have totalItems and can estimate pages (assuming default page size)
        if (response.totalItems) {
            // Assuming 30 items per page as default
            const itemsPerPage = 30;
            return Math.ceil(response.totalItems / itemsPerPage);
        }
        // Default to 1 if we can't determine
        return 1;
    }

    // =====================================
    // Part Info Request Methods
    // =====================================

    /**
     * Get all info requests for an inquiry
     */
    getInfoRequestsByInquiry(inquiryId: string): Observable<InquiryPartInfoRequest[]> {
        return this.http.get<any>(`${this.apiUrl}/${inquiryId}/part-info-requests`).pipe(
            map(response => response['hydra:member'] || response.member || []),
            catchError(error => {
                console.error('Error fetching info requests:', error);
                return of([]);
            })
        );
    }

    /**
     * Get a single info request with all messages
     */
    getInfoRequest(infoRequestId: string): Observable<InquiryPartInfoRequest> {
        return this.http.get<InquiryPartInfoRequest>(
            `${environment.apiBaseUrl}/api/v1/inquiry_part_info_requests/${infoRequestId}`
        );
    }

    /**
     * Create a new info request for a part with initial message
     */
    createInfoRequest(payload: CreateInfoRequestPayload): Observable<InquiryPartInfoRequest> {
        // Step 1: Create the info request
        const infoRequestBody = {
            inquiry: payload.inquiry,
            inquiryMachinePart: payload.inquiryMachinePart
        };

        return this.http.post<InquiryPartInfoRequest>(
            `${environment.apiBaseUrl}/api/v1/inquiry_part_info_requests`,
            infoRequestBody,
            this.httpOptions
        ).pipe(
            tap(response => console.log('Info request created:', response)),
            // Step 2: Add the initial message
            switchMap((infoRequest) => {
                const messageBody = {
                    infoRequest: `/api/v1/inquiry_part_info_requests/${infoRequest.id}`,
                    messageText: payload.initialMessage,
                    senderType: 'admin',
                    mediaItems: payload.attachments || []
                };

                return this.http.post<any>(
                    `${environment.apiBaseUrl}/api/v1/inquiry_part_info_messages`,
                    messageBody,
                    this.httpOptions
                ).pipe(
                    tap(message => console.log('Initial message created:', message)),
                    // Return the info request with the message included
                    map(() => infoRequest)
                );
            }),
            catchError(error => {
                console.error('Error creating info request:', error);
                throw error;
            })
        );
    }

    /**
     * Add a message to an existing info request thread
     */
    addMessageToInfoRequest(infoRequestId: string, payload: CreateInfoMessagePayload): Observable<InquiryPartInfoMessage> {
        const body = {
            infoRequest: `/api/v1/inquiry_part_info_requests/${infoRequestId}`,
            messageText: payload.messageText,
            senderType: payload.senderType,
            mediaItems: payload.attachments || []
        };

        return this.http.post<InquiryPartInfoMessage>(
            `${environment.apiBaseUrl}/api/v1/inquiry_part_info_messages`,
            body,
            this.httpOptions
        ).pipe(
            tap(response => console.log('Message added:', response)),
            catchError(error => {
                console.error('Error adding message:', error);
                throw error;
            })
        );
    }

    /**
     * Update info request status (accept, needs_revision)
     */
    updateInfoRequestStatus(infoRequestId: string, status: 'accepted' | 'needs_revision'): Observable<InquiryPartInfoRequest> {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        };

        return this.http.patch<InquiryPartInfoRequest>(
            `${environment.apiBaseUrl}/api/v1/inquiry_part_info_requests/${infoRequestId}`,
            { status },
            options
        ).pipe(
            tap(response => console.log('Info request status updated:', response)),
            catchError(error => {
                console.error('Error updating info request status:', error);
                throw error;
            })
        );
    }

    /**
     * Update a part's info status (mark as clear)
     */
    updatePartInfoStatus(partId: string, infoStatus: PartInfoStatus): Observable<InquiryMachinePart> {
        const options = {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        };

        return this.http.patch<InquiryMachinePart>(
            `${environment.apiBaseUrl}/api/v1/inquiry_machine_parts/${partId}`,
            { infoStatus },
            options
        ).pipe(
            tap(response => console.log('Part info status updated:', response)),
            catchError(error => {
                console.error('Error updating part info status:', error);
                throw error;
            })
        );
    }
}
