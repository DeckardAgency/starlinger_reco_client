import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LinkedProducts, Product, ProductLinkRelationType, ProductProductLink, ProductProductLinksCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductLinkService extends BaseHttpService {
  private readonly productService = inject(ProductService);

  private readonly endpoint = `${this.apiUrl}/product_product_links`;

  /**
   * Links where `parentId` is the parent product, in display order (`ord` asc).
   * One page of 100 is the API maximum and more than enough for a single part.
   */
  getLinksForParent(parentId: number): Observable<ProductProductLink[]> {
    const params = this.buildParams({ parentProductId: parentId, itemsPerPage: 100, 'order[ord]': 'asc' });
    return this.getWithJsonLd<ProductProductLinksCollection>(this.endpoint, params).pipe(
      // Sorted again client-side (stable) so the display order never depends on the order filter.
      map(response => [...response.member].sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0)))
    );
  }

  /**
   * The parent's alternative/replacement parts: its links (in `ord` order) with the child
   * products batch-fetched by id, so they carry the caller's prices (the ForClientInterceptor
   * tags the request for agents). Any failure degrades to empty lists so the product itself
   * still renders.
   */
  getLinkedProducts(parentId: number): Observable<LinkedProducts<Product>> {
    const empty: LinkedProducts<Product> = { alternative: [], replacement: [] };

    return this.getLinksForParent(parentId).pipe(
      switchMap(links => {
        if (links.length === 0) {
          return of(empty);
        }
        const childIds = [...new Set(links.map(link => link.childProductId))];
        return this.productService.getProductsByIds(childIds).pipe(
          map(({ member }) => {
            const byId = new Map<number, Product>(member.map(product => [product.id, product]));
            const pick = (type: ProductLinkRelationType): Product[] => links
              .filter(link => link.relationType === type)
              .map(link => byId.get(link.childProductId))
              .filter((product): product is Product => product !== undefined);
            return { alternative: pick('alternative'), replacement: pick('replacement') };
          })
        );
      }),
      catchError(error => {
        console.error('Failed to load linked products:', error);
        return of(empty);
      })
    );
  }
}
