import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductProductLink, ProductProductLinksCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductLinkService extends BaseHttpService {

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
}
