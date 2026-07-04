import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ProductGroup, ProductGroupsCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductGroupService extends BaseHttpService {

  private readonly endpoint = `${this.apiUrl}/product_groups`;

  // Cached reference-data call (product groups rarely change)
  private productGroupsCache$: Observable<ProductGroupsCollection> | null = null;

  /**
   * Get all product groups with optional pagination.
   * The default (parameter-less) call is cached for the lifetime of the app.
   */
  getProductGroups(page: number = 1, itemsPerPage: number = 30): Observable<ProductGroupsCollection> {
    const isDefaultCall = page === 1 && itemsPerPage === 30;

    if (isDefaultCall && this.productGroupsCache$) {
      return this.productGroupsCache$;
    }

    const params = this.buildParams({
      page,
      itemsPerPage
    });

    const request$ = this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);

    if (!isDefaultCall) {
      return request$;
    }

    this.productGroupsCache$ = request$.pipe(
      catchError((error) => {
        // Don't cache failed fetches
        this.productGroupsCache$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.productGroupsCache$;
  }

  clearCache(): void {
    this.productGroupsCache$ = null;
  }

  /**
   * Get product groups that should be shown on homepage
   */
  getHomepageGroups(): Observable<ProductGroupsCollection> {
    const params = this.buildParams({
      showOnHomepage: true,
      isActive: true
    });

    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get a single product group by ID
   */
  getProductGroupById(id: string): Observable<ProductGroup> {
    return this.getWithJsonLd<ProductGroup>(`${this.endpoint}/${id}`);
  }

  /**
   * Get product group by slug
   */
  getProductGroupBySlug(slug: string): Observable<ProductGroupsCollection> {
    const params = this.buildParams({ slug });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get product group by code
   */
  getProductGroupByCode(code: string): Observable<ProductGroupsCollection> {
    const params = this.buildParams({ productGroupCode: code });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get child groups for a parent group
   */
  getChildGroups(parentId: string): Observable<ProductGroupsCollection> {
    const params = new HttpParams().set('parent', parentId);
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get root-level groups (no parent)
   */
  getRootGroups(): Observable<ProductGroupsCollection> {
    const params = this.buildParams({
      level: 0,
      isActive: true
    });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }
}
