/**
 * Product Group Model
 * Represents a category/group of products in the shop
 */

export interface ProductGroup {
  id: string;
  name: string;
  totalProducts: number;
  imageUrl?: string;
}


