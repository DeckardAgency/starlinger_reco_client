import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { PaymentType, PaymentTypesCollection } from '@core/models/payment-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/payment_types`;

  // Cached reference-data call (payment types rarely change)
  private paymentTypesCache$: Observable<PaymentTypesCollection> | null = null;

  getPaymentTypes(page: number = 1, itemsPerPage: number = 100): Observable<PaymentTypesCollection> {
    const isDefaultCall = page === 1 && itemsPerPage === 100;

    if (isDefaultCall && this.paymentTypesCache$) {
      return this.paymentTypesCache$;
    }

    const params = this.buildParams({ page, itemsPerPage });
    const request$ = this.getWithJsonLd<PaymentTypesCollection>(this.endpoint, params);

    if (!isDefaultCall) {
      return request$;
    }

    this.paymentTypesCache$ = request$.pipe(
      catchError((error) => {
        // Don't cache failed fetches
        this.paymentTypesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.paymentTypesCache$;
  }

  clearCache(): void {
    this.paymentTypesCache$ = null;
  }

  getPaymentTypeById(id: string): Observable<PaymentType> {
    return this.getWithJsonLd<PaymentType>(`${this.endpoint}/${id}`);
  }
}
