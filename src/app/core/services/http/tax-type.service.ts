import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { TaxType, TaxTypesCollection } from '@core/models/tax-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class TaxTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/tax_types`;

  // Cached reference-data call (tax types rarely change)
  private taxTypesCache$: Observable<TaxTypesCollection> | null = null;

  getTaxTypes(page: number = 1, itemsPerPage: number = 100): Observable<TaxTypesCollection> {
    const isDefaultCall = page === 1 && itemsPerPage === 100;

    if (isDefaultCall && this.taxTypesCache$) {
      return this.taxTypesCache$;
    }

    const params = this.buildParams({ page, itemsPerPage });
    const request$ = this.getWithJsonLd<TaxTypesCollection>(this.endpoint, params);

    if (!isDefaultCall) {
      return request$;
    }

    this.taxTypesCache$ = request$.pipe(
      catchError((error) => {
        // Don't cache failed fetches
        this.taxTypesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.taxTypesCache$;
  }

  clearCache(): void {
    this.taxTypesCache$ = null;
  }

  getTaxTypeById(id: string): Observable<TaxType> {
    return this.getWithJsonLd<TaxType>(`${this.endpoint}/${id}`);
  }
}
