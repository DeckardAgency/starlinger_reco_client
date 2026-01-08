import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { InquiryMachinePart, InquiryMachine } from '@models/manual-entry.model';
import { MediaItem } from '@models/media.model';
import { MediaService } from '@services/http/media.service';
import { environment } from '@env/environment';

export interface InfoRequestSubmitData {
    part: InquiryMachinePart;
    machine: InquiryMachine;
    messageText: string;
    attachments: string[]; // IRI references to media items
}

interface UploadingFile {
    file: File;
    progress: number;
    preview: string;
    error?: string;
}

export interface ResponseTemplate {
    id: string;
    label: string;
    text: string;
}

export const INFO_REQUEST_TEMPLATES: ResponseTemplate[] = [
    {
        id: 'photo_request',
        label: 'Photo Request',
        text: 'Please provide clear photos of the part from multiple angles, including any visible part numbers or labels.'
    },
    {
        id: 'serial_number',
        label: 'Serial Number Needed',
        text: 'Please provide the serial number or identification number visible on the part. This is usually stamped or printed on a metal plate.'
    },
    {
        id: 'dimensions',
        label: 'Dimensions Required',
        text: 'Please provide the exact dimensions of the part (length, width, height) in millimeters. If possible, include a photo with a ruler or measuring tape for reference.'
    },
    {
        id: 'condition_assessment',
        label: 'Condition Assessment',
        text: 'Please describe the current condition of the part and any visible damage or wear. Photos showing the damaged areas would be helpful.'
    },
    {
        id: 'quantity_confirmation',
        label: 'Quantity Confirmation',
        text: 'Please confirm the exact quantity needed for this part.'
    },
    {
        id: 'installation_location',
        label: 'Installation Location',
        text: 'Please specify where this part is installed on the machine and provide a photo of the installation location if possible.'
    },
    {
        id: 'urgency_timeline',
        label: 'Urgency & Timeline',
        text: 'Please indicate the urgency level and your preferred delivery timeline for this part.'
    },
    {
        id: 'additional_context',
        label: 'Additional Context',
        text: 'Please provide any additional context or information that might help us identify the correct part for your needs.'
    }
];

@Component({
    selector: 'app-info-request-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './info-request-modal.component.html',
    styleUrls: ['./info-request-modal.component.scss']
})
export class InfoRequestModalComponent implements OnChanges {
    private mediaService = inject(MediaService);

    @Input() isOpen: boolean = false;
    @Input() part: InquiryMachinePart | null = null;
    @Input() machine: InquiryMachine | null = null;
    @Input() saving: boolean = false;
    @Input() mode: 'create' | 'revision' = 'create';

    @Output() closeModal = new EventEmitter<void>();
    @Output() submitRequest = new EventEmitter<InfoRequestSubmitData>();

    messageText: string = '';
    uploadedFiles: MediaItem[] = [];
    uploadingFiles: UploadingFile[] = [];
    isUploading: boolean = false;

    // Response templates
    templates = INFO_REQUEST_TEMPLATES;
    showTemplateDropdown: boolean = false;

    // Image preview modal
    previewImage: string | null = null;
    previewFilename: string = '';

    ngOnChanges(changes: SimpleChanges): void {
        // Reset form when modal opens
        if (changes['isOpen'] && this.isOpen) {
            this.resetForm();
        }
    }

    resetForm(): void {
        this.messageText = '';
        this.uploadedFiles = [];
        this.uploadingFiles = [];
        this.previewImage = null;
        this.previewFilename = '';
        this.showTemplateDropdown = false;
    }

    toggleTemplateDropdown(): void {
        this.showTemplateDropdown = !this.showTemplateDropdown;
    }

    selectTemplate(template: ResponseTemplate): void {
        if (this.messageText.trim()) {
            // Append to existing text with line break
            this.messageText = this.messageText.trim() + '\n\n' + template.text;
        } else {
            this.messageText = template.text;
        }
        this.showTemplateDropdown = false;
    }

    onClose(): void {
        if (!this.saving && !this.isUploading) {
            this.closeModal.emit();
        }
    }

    onSubmit(): void {
        if (!this.part || !this.machine || !this.messageText.trim()) {
            return;
        }

        this.submitRequest.emit({
            part: this.part,
            machine: this.machine,
            messageText: this.messageText.trim(),
            attachments: this.uploadedFiles.map(f => f['@id'] || `/api/v1/media_items/${f.id}`)
        });
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.onClose();
        }
    }

    onFileUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);

            // Filter only images (jpg, png)
            const validFiles = files.filter(file => {
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                const isValid = validTypes.includes(file.type);
                const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

                if (!isValid) {
                    console.warn(`Invalid file type: ${file.type}`);
                }
                if (!isValidSize) {
                    console.warn(`File too large: ${file.name}`);
                }

                return isValid && isValidSize;
            });

            // Upload each file
            validFiles.forEach(file => this.uploadFile(file));

            // Reset input so the same file can be selected again
            input.value = '';
        }
    }

    private uploadFile(file: File): void {
        // Create preview
        const reader = new FileReader();
        const uploadingFile: UploadingFile = {
            file,
            progress: 0,
            preview: ''
        };

        reader.onload = (e) => {
            uploadingFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        this.uploadingFiles.push(uploadingFile);
        this.isUploading = true;

        this.mediaService.uploadFile(file).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    uploadingFile.progress = Math.round((event.loaded / event.total) * 100);
                } else if (event.type === HttpEventType.Response) {
                    // Upload complete - add to uploaded files
                    const mediaItem = event.body as MediaItem;
                    this.uploadedFiles.push(mediaItem);

                    // Remove from uploading list
                    const index = this.uploadingFiles.indexOf(uploadingFile);
                    if (index > -1) {
                        this.uploadingFiles.splice(index, 1);
                    }

                    this.updateUploadingStatus();
                }
            },
            error: (error) => {
                console.error('Upload failed:', error);
                uploadingFile.error = 'Upload failed';

                // Remove failed upload after a delay
                setTimeout(() => {
                    const index = this.uploadingFiles.indexOf(uploadingFile);
                    if (index > -1) {
                        this.uploadingFiles.splice(index, 1);
                    }
                    this.updateUploadingStatus();
                }, 2000);
            }
        });
    }

    private updateUploadingStatus(): void {
        this.isUploading = this.uploadingFiles.length > 0;
    }

    removeFile(index: number): void {
        const file = this.uploadedFiles[index];
        this.uploadedFiles.splice(index, 1);

        // Optionally delete from server
        if (file.id) {
            this.mediaService.deleteMediaItem(file.id).subscribe({
                error: (err) => console.warn('Could not delete file from server:', err)
            });
        }
    }

    removeUploadingFile(index: number): void {
        this.uploadingFiles.splice(index, 1);
        this.updateUploadingStatus();
    }

    getFileUrl(file: MediaItem): string {
        if (file.filePath) {
            return `${environment.apiBaseUrl}${file.filePath}`;
        }
        return '';
    }

    isImageFile(file: MediaItem): boolean {
        return file.mimeType?.startsWith('image/') || false;
    }

    openImagePreview(file: MediaItem): void {
        if (this.isImageFile(file)) {
            this.previewImage = this.getFileUrl(file);
            this.previewFilename = file.filename;
        }
    }

    openUploadingPreview(uploadingFile: UploadingFile): void {
        if (uploadingFile.preview) {
            this.previewImage = uploadingFile.preview;
            this.previewFilename = uploadingFile.file.name;
        }
    }

    closeImagePreview(): void {
        this.previewImage = null;
        this.previewFilename = '';
    }

    onPreviewBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('preview-backdrop')) {
            this.closeImagePreview();
        }
    }

    get isValid(): boolean {
        return this.messageText.trim().length > 0;
    }

    get modalTitle(): string {
        return this.mode === 'create' ? 'Request Information' : 'Request Additional Information';
    }

    get submitButtonText(): string {
        if (this.saving) return 'Sending...';
        return this.mode === 'create' ? 'Send Request' : 'Send Follow-up';
    }

    get hasFiles(): boolean {
        return this.uploadedFiles.length > 0 || this.uploadingFiles.length > 0;
    }
}
