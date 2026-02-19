export interface WishlistItem {
  id: number;
  productId: number;  // ID from the API — used when adding to cart/creating orders
  productCode: string;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  isFavorite: boolean;
}

