import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ClientAddress, ClientAddressesResponse } from '@models/client.model';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})
export class AddressService {
    constructor(private http: HttpClient) {}

    /**
     * Get all addresses for a specific client
     */
    getAddressesByClient(clientId: number): Observable<ClientAddress[]> {
        const url = `${environment.apiBaseUrl}/api/v1/clients/${clientId}/addresses`;
        return this.http.get<ClientAddressesResponse>(url).pipe(
            map(response => response.member || []),
            catchError(error => {
                console.error('Error loading addresses:', error);
                return of([]);
            })
        );
    }

    /**
     * Get the active billing address for a client
     */
    getActiveBillingAddress(clientId: number): Observable<ClientAddress | null> {
        return this.getAddressesByClient(clientId).pipe(
            map(addresses => addresses.find(a => a.isBilling && a.isActive) ?? null)
        );
    }

    /**
     * Get the active delivery/shipping address for a client
     */
    getActiveShippingAddress(clientId: number): Observable<ClientAddress | null> {
        return this.getAddressesByClient(clientId).pipe(
            map(addresses => addresses.find(a => a.isDelivery && a.isActive) ?? null)
        );
    }

    /**
     * Format an address into a display string
     */
    formatAddress(address: ClientAddress): string {
        const parts = [address.street, address.city];
        if (address.country?.name) {
            parts.push(address.country.name);
        }
        return parts.join(', ');
    }
}
