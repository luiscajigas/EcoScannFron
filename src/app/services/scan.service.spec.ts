import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ScanService } from './scan.service';

describe('ScanService', () => {
  const API = environment.apiUrl;
  let service: ScanService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ScanService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('requests a page of the history', () => {
    service.getHistory({ limit: 11, offset: 10 }).subscribe();
    const { request } = backend.expectOne((r) => r.url === `${API}/scans`);
    expect(request.params.get('limit')).toBe('11');
    expect(request.params.get('offset')).toBe('10');
    expect(request.params.has('category')).toBeFalse();
  });

  it('only sends the category when there is a filter', () => {
    service.getHistory({ limit: 11, offset: 0, category: 'glass' }).subscribe();
    const { request } = backend.expectOne((r) => r.url === `${API}/scans`);
    expect(request.params.get('category')).toBe('glass');
  });

  it('keeps the slash of the time zone readable for the contract', () => {
    service.getStats('America/Bogota').subscribe();
    const { request } = backend.expectOne((r) => r.url === `${API}/users/me/stats`);
    expect(request.urlWithParams).toContain('timeZone=America/Bogota');
  });
});
