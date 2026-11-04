import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Scan, ScanRequest, ScanResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getHistory(): Observable<Scan[]> {
    return this.http.get<Scan[]>(`${this.apiUrl}/scans`);
  }

  create(request: ScanRequest): Observable<ScanResult> {
    return this.http.post<ScanResult>(`${this.apiUrl}/scans`, request);
  }
}
