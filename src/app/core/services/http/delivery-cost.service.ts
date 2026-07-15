import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { LoggerService } from '@core/services/logger.service';

export interface DeliveryCostResult {
    deliveryCost: number;
    fuelSurchargeMultiplier: number;
    fuelSurchargeCost: number;
    packagingCost: number;
    totalShippingCost: number;
    deliveryDays: number | null;
    deliveryTypeName?: string;
    dhlZone?: number;
    weight?: number;
    message?: string;
    /** True when the cost could not be calculated (network/backend failure). */
    error?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DeliveryCostService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/delivery-cost/calculate`;

    constructor(private http: HttpClient, private logger: LoggerService) {}

    /**
     * Calculate delivery cost based on country, weight, and optional delivery type
     */
    calculateDeliveryCost(countryId: number, weight: number, deliveryTypeId?: number): Observable<DeliveryCostResult> {
        let params = new HttpParams()
            .set('countryId', countryId.toString())
            .set('weight', weight.toString());

        if (deliveryTypeId) {
            params = params.set('deliveryTypeId', deliveryTypeId.toString());
        }

        return this.http.get<DeliveryCostResult>(this.apiUrl, { params }).pipe(
            catchError(error => {
                this.logger.error('Error calculating delivery cost:', error);
                return of({ deliveryCost: 0, fuelSurchargeMultiplier: 1.0, fuelSurchargeCost: 0, packagingCost: 0, totalShippingCost: 0, deliveryDays: null, message: 'Could not calculate delivery cost', error: true });
            })
        );
    }

    /**
     * Parse a weight string (e.g. "0,4 kg", "1.5", "0.263 kg") to a number in kg
     */
    parseWeight(weightStr: string | undefined): number {
        if (!weightStr) return 0;
        // Remove "kg" suffix and trim
        let cleaned = weightStr.replace(/\s*kg\s*/gi, '').trim();
        // Replace comma with dot for decimal
        cleaned = cleaned.replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
}
