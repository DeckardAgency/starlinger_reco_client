import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { Country, CountriesCollection } from '@core/models/country.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/countries`;

  // Cached reference-data call (countries rarely change)
  private countriesCache$: Observable<CountriesCollection> | null = null;

  getCountries(page: number = 1, itemsPerPage: number = 100): Observable<CountriesCollection> {
    const isDefaultCall = page === 1 && itemsPerPage === 100;

    if (isDefaultCall && this.countriesCache$) {
      return this.countriesCache$;
    }

    const params = this.buildParams({ page, itemsPerPage });
    const request$ = this.getWithJsonLd<CountriesCollection>(this.endpoint, params);

    if (!isDefaultCall) {
      return request$;
    }

    this.countriesCache$ = request$.pipe(
      catchError((error) => {
        // Don't cache failed fetches
        this.countriesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.countriesCache$;
  }

  clearCache(): void {
    this.countriesCache$ = null;
  }

  getCountryById(id: string): Observable<Country> {
    return this.getWithJsonLd<Country>(`${this.endpoint}/${id}`);
  }
}
