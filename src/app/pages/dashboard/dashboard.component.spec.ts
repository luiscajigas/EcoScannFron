import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Scan, UserStats } from '../../models/models';
import { ImageAnalysisError, ImageAnalysisService } from '../../services/image-analysis.service';
import { AnalysisResult } from '../../workers/analysis.messages';
import { DashboardComponent } from './dashboard.component';

const ANALYSIS: AnalysisResult = {
  categoryKey: 'plastic',
  confidence: 0.6,
  widthPx: 10,
  heightPx: 10,
  compressedImageBase64: 'data:image/jpeg;base64,AAAA',
  thumbnailBase64: 'data:image/jpeg;base64,BBBB'
};

const STATS: UserStats = {
  totalScans: 12,
  currentStreak: 1,
  longestStreak: 2,
  byCategory: [{ categoryKey: 'plastic', count: 8 }, { categoryKey: 'metal', count: 4 }],
  lastSevenDays: []
};

const scanWithId = (id: number): Scan => ({
  id,
  categoryKey: 'plastic',
  categoryName: 'Plástico',
  instructions: 'x',
  binColor: 'white',
  confidence: 0.8,
  source: 'ai',
  pointsAwarded: 15,
  createdAt: '2026-11-04T00:00:00.000Z',
  thumbnail: null
});

describe('DashboardComponent', () => {
  const SCANS_URL = `${environment.apiUrl}/scans`;
  const STATS_URL = `${environment.apiUrl}/users/me/stats`;
  let analyze: jasmine.Spy;
  let backend: HttpTestingController;
  let component: DashboardComponent;

  const photo = () => new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
  const select = (file: File) => {
    const target = { files: [file], value: 'C:\\photo.jpg' };
    return { target, done: component.onFileSelected({ target } as unknown as Event) };
  };
  const expectHistory = () => backend.expectOne((request) => request.url === SCANS_URL && request.method === 'GET');
  const expectStats = () => backend.expectOne((request) => request.url === STATS_URL);

  beforeEach(() => {
    localStorage.clear();
    analyze = jasmine.createSpy('analyze').and.resolveTo(ANALYSIS);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).overrideComponent(DashboardComponent, {
      set: { providers: [{ provide: ImageAnalysisService, useValue: { analyze } }] }
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    backend = TestBed.inject(HttpTestingController);
    expectHistory().flush([]);
    expectStats().flush(STATS);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('rejects a file that is not an image without analyzing it', async () => {
    await select(new File(['x'], 'note.txt', { type: 'text/plain' })).done;
    expect(analyze).not.toHaveBeenCalled();
    expect(component.error()).toContain('no es una imagen');
    expect(component.isProcessing()).toBeFalse();
  });

  it('rejects a photo that is too heavy', async () => {
    const heavy = photo();
    Object.defineProperty(heavy, 'size', { value: 26 * 1024 * 1024 });
    await select(heavy).done;
    expect(analyze).not.toHaveBeenCalled();
    expect(component.error()).toContain('25 MB');
  });

  it('clears the file input so the same photo can be chosen again', async () => {
    analyze.and.rejectWith(new ImageAnalysisError('invalid-image', 'damaged'));
    const { target, done } = select(photo());
    await done;
    expect(target.value).toBe('');
  });

  it('shows the analysis error and frees the screen', async () => {
    analyze.and.rejectWith(new ImageAnalysisError('invalid-image', 'damaged'));
    await select(photo()).done;
    expect(component.error()).toContain('damaged');
    expect(component.isProcessing()).toBeFalse();
  });

  it('warns if the analysis took too long', async () => {
    analyze.and.rejectWith(new ImageAnalysisError('timed-out'));
    await select(photo()).done;
    expect(component.error()).toContain('tardó demasiado');
  });

  it('releases the previous preview when another photo is chosen', async () => {
    analyze.and.rejectWith(new ImageAnalysisError('invalid-image', 'x'));
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    await select(photo()).done;
    const previous = component.preview();
    await select(photo()).done;
    expect(revoke).toHaveBeenCalledWith(previous!);
  });

  it('saves the scan with its thumbnail and refreshes the history and statistics', async () => {
    await select(photo()).done;

    const request = backend.expectOne((r) => r.url === SCANS_URL && r.method === 'POST');
    expect(request.request.body.imageBase64).toBe(ANALYSIS.compressedImageBase64);
    expect(request.request.body.thumbnailBase64).toBe(ANALYSIS.thumbnailBase64);
    request.flush({
      id: 1,
      category: { key: 'plastic', name: 'Plástico', instructions: 'x', binColor: 'white' },
      source: 'ai',
      confidence: 0.9,
      pointsAwarded: 15,
      totalPoints: 15
    });

    expect(component.result()?.totalPoints).toBe(15);
    expect(component.isProcessing()).toBeFalse();
    expectHistory().flush([]);
    expectStats().flush(STATS);
  });

  it('sends the time zone to the statistics', () => {
    component.ngOnInit();
    expectHistory().flush([]);
    const request = expectStats();
    expect(request.request.params.get('timeZone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    request.flush(STATS);
  });

  it('shows a message if the statistics fail, without affecting the history', () => {
    component.ngOnInit();
    expectHistory().flush([scanWithId(1)]);
    expectStats().flush({}, { status: 500, statusText: 'Error' });
    expect(component.hasStatsError()).toBeTrue();
    expect(component.history().length).toBe(1);
  });

  describe('history pagination', () => {
    const ids = (from: number, count: number) => Array.from({ length: count }, (_, i) => scanWithId(from + i));

    it('asks for one extra row to know if there is another page', () => {
      component.onHistoryFilterChange(null);
      const request = expectHistory();
      expect(request.request.params.get('limit')).toBe('11');
      expect(request.request.params.get('offset')).toBe('0');
      request.flush(ids(1, 11));

      expect(component.history().length).toBe(10);
      expect(component.hasMoreHistory()).toBeTrue();
    });

    it('adds the next page after the loaded rows', () => {
      component.onHistoryFilterChange(null);
      expectHistory().flush(ids(1, 11));

      component.loadMoreHistory();
      const request = expectHistory();
      expect(request.request.params.get('offset')).toBe('10');
      request.flush(ids(11, 3));

      expect(component.history().map((s) => s.id)).toEqual([...ids(1, 10), ...ids(11, 3)].map((s) => s.id));
      expect(component.hasMoreHistory()).toBeFalse();
      expect(component.isLoadingMoreHistory()).toBeFalse();
    });
  });

  describe('history filter', () => {
    it('reloads from the first page with the chosen category', () => {
      component.onHistoryFilterChange('metal');
      const request = expectHistory();
      expect(request.request.params.get('category')).toBe('metal');
      expect(request.request.params.get('offset')).toBe('0');
      request.flush([scanWithId(1)]);
    });

    it('does not send the category when showing all of them', () => {
      component.onHistoryFilterChange(null);
      const request = expectHistory();
      expect(request.request.params.has('category')).toBeFalse();
      request.flush([]);
    });

    it('cancels the previous request so it cannot overwrite the new filter', () => {
      component.onHistoryFilterChange('metal');
      const slow = expectHistory();
      component.onHistoryFilterChange('plastic');
      expect(slow.cancelled).toBeTrue();
      expectHistory().flush([]);
    });

    it('the counter follows the filter', () => {
      expect(component.historyCount()).toBe(12);
      component.onHistoryFilterChange('metal');
      expectHistory().flush([]);
      expect(component.historyCount()).toBe(4);
      component.onHistoryFilterChange('glass');
      expectHistory().flush([]);
      expect(component.historyCount()).toBe(0);
    });
  });
});
