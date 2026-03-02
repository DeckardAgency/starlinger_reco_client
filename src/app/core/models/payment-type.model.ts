export interface PaymentType {
  id: number;
  name: string;
  isActive: boolean;
  readyForShop: boolean;
  enableInstallments: boolean;
  configuration: string | null;
  providerCode: string | null;
  shortDescription: string;
  useAsDefaultBase: boolean;
  remoteCode: string | null;
  paymentFee: number;
  minCartTotalBase: number;
  maxCartTotalBase: number;
  documents: PaymentTypeDocument[];
  selected?: boolean;
}

export interface PaymentTypeDocument {
  id: number;
  fileType: string;
  name: string;
  size: string;
  selected?: boolean;
}

export interface PaymentTypesCollection {
  totalItems: number;
  member: PaymentType[];
}

