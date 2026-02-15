export interface WishlistItem {
  id: string;
  productId: string;  // UUID from the API — used when adding to cart/creating orders
  productCode: string;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  isFavorite: boolean;
}

