import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoryKey, Scan, ScanRequest, ScanResult, UserStats } from '../models/models';

export interface HistoryQuery {
  limit: number;
  offset: number;
  category?: CategoryKey;
}

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getHistory({ limit, offset, category }: HistoryQuery): Observable<Scan[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (category) params = params.set('category', category);
    return this.http.get<Scan[]>(`${this.apiUrl}/scans`, { params });
  }

  getStats(timeZone: string): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/users/me/stats`, { params: { timeZone } });
  }

  create(request: ScanRequest): Observable<ScanResult> {
    return this.http.post<ScanResult>(`${this.apiUrl}/scans`, request);
  }
}
