import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ImageAnalysisError, ImageAnalysisService } from '../../services/image-analysis.service';
import { AnalysisResult } from '../../workers/analysis.messages';
import { DashboardComponent } from './dashboard.component';

const ANALYSIS: AnalysisResult = {
  categoryKey: 'plastic',
  confidence: 0.6,
  widthPx: 10,
  heightPx: 10,
  compressedImageBase64: 'data:image/jpeg;base64,AAAA'
};

describe('DashboardComponent', () => {
  const SCANS_URL = `${environment.apiUrl}/scans`;
  let analyze: jasmine.Spy;
  let backend: HttpTestingController;
  let component: DashboardComponent;

  const photo = () => new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
  const select = (file: File) => {
    const target = { files: [file], value: 'C:\\photo.jpg' };
    return { target, done: component.onFileSelected({ target } as unknown as Event) };
  };

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
    backend.expectOne(SCANS_URL).flush([]);
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

  it('saves the scan and updates the history', async () => {
    await select(photo()).done;

    const request = backend.expectOne(SCANS_URL);
    expect(request.request.body.imageBase64).toBe(ANALYSIS.compressedImageBase64);
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
    backend.expectOne(SCANS_URL).flush([]);
  });
});
