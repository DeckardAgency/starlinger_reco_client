// src/app/core/models/shop-product.model.ts

export interface ShopProductMedia {
  id: number;
  filePath: string;
  filename: string;
  mimeType: string;
}

export interface ShopProduct {
  id: number;
  code: string;
  name: string;
  price: number;
  image: string;
  isFavorite: boolean;
  group: string;
  /** False = out of stock ("Currently not available"): not addable to the cart, blocks checkout. */
  inStock: boolean;
  technicalDescription?: string;
  shortDescription?: string;
  weight?: string;
  imageGallery?: ShopProductMedia[];
  documents?: ShopProductMedia[];
  qtyStep?: number | null;
  /** Max quantity purchasable per order line (legacy "quote item limit"). */
  quoteItemLimit?: number | null;
  discountedPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
}
