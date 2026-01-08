export interface PackagingPrice {
  id: string;
  name: string;
  sizeFrom: number;
  sizeTo: number;
  priceBase: number;
  selected?: boolean;
}

