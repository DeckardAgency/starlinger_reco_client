export interface DeliveryPrice {
  id: string;
  name: string;
  dhlZone: string;
  deliveryType: string;
  sizeFrom: number;
  sizeTo: number;
  priceBase: number;
  stepStartsAt: number;
  forEveryNextSize: number;
  priceBaseStep: number;
  selected?: boolean;
}

