export interface DeliveryTypeRef {
  '@id': string;
  '@type': string;
  id: number;
  name: string;
}

export interface FuelSurcharge {
  id: number;
  name: string;
  date: string;
  fuelSurcharge: number;
  deliveryType: DeliveryTypeRef | string;
  createdAt?: string;
  updatedAt?: string;
  legacyId?: number;
  selected?: boolean;
}

export interface FuelSurchargesCollection {
  totalItems: number;
  member: FuelSurcharge[];
}
