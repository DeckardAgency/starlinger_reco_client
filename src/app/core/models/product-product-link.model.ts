/** How a linked (child) part relates to the parent product it is attached to. */
export type ProductLinkRelationType = 'alternative' | 'replacement';

/**
 * API resource `product_product_links`: a parent → child product link shown on
 * the product detail page as an alternative or replacement part.
 */
export interface ProductProductLink {
  id: number;
  parentProductId: number;
  childProductId: number;
  relationType: ProductLinkRelationType;
  /** Display order within the parent's links (ascending). */
  ord: number | null;
}

export interface ProductProductLinksCollection {
  totalItems: number;
  member: ProductProductLink[];
}
