import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentType, PaymentTypesCollection } from '@core/models/payment-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/payment_types`;

  getPaymentTypes(page: number = 1, itemsPerPage: number = 100): Observable<PaymentTypesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<PaymentTypesCollection>(this.endpoint, params);
  }

  getPaymentTypeById(id: string): Observable<PaymentType> {
    return this.getWithJsonLd<PaymentType>(`${this.endpoint}/${id}`);
  }
}
