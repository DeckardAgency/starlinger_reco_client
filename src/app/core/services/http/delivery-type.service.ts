import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { DeliveryType, DeliveryTypesCollection } from '@core/models/delivery-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/delivery_types`;

  // Cached reference-data call (delivery types rarely change)
  private deliveryTypesCache$: Observable<DeliveryTypesCollection> | null = null;

  getDeliveryTypes(page: number = 1, itemsPerPage: number = 100): Observable<DeliveryTypesCollection> {
    const isDefaultCall = page === 1 && itemsPerPage === 100;

    if (isDefaultCall && this.deliveryTypesCache$) {
      return this.deliveryTypesCache$;
    }

    const params = this.buildParams({ page, itemsPerPage });
    const request$ = this.getWithJsonLd<DeliveryTypesCollection>(this.endpoint, params);

    if (!isDefaultCall) {
      return request$;
    }

    this.deliveryTypesCache$ = request$.pipe(
      catchError((error) => {
        // Don't cache failed fetches
        this.deliveryTypesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.deliveryTypesCache$;
  }

  clearCache(): void {
    this.deliveryTypesCache$ = null;
  }

  getDeliveryTypeById(id: string): Observable<DeliveryType> {
    return this.getWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`);
  }
}
