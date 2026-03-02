export interface DeliveryType {
  id: number;
  name: string;
  isActive: boolean;
  readyForShop: boolean;
  express: boolean;
  enableFreeDelivery: boolean;
  grossFactor: number;
  order: number;
  shortDescription: string;
  documents: DeliveryTypeDocument[];
  selected?: boolean;
}

export interface DeliveryTypeDocument {
  id: number;
  fileType: string;
  name: string;
  size: string;
  selected?: boolean;
}

export interface DeliveryTypesCollection {
  totalItems: number;
  member: DeliveryType[];
}

