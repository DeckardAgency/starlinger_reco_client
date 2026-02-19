export interface PackagingPrice {
  id: number;
  name: string;
  sizeFrom: number;
  sizeTo: number;
  priceBase: number;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
}

export interface PackagingPricesCollection {
  totalItems: number;
  member: PackagingPrice[];
}

