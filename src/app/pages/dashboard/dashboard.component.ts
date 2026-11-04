import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Scan, ScanResult } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { ImageAnalysisError, ImageAnalysisService } from '../../services/image-analysis.service';
import { LanguageService } from '../../services/language.service';
import { ScanService } from '../../services/scan.service';
import { ThemeService } from '../../services/theme.service';
import { AnalysisResult } from '../../workers/analysis.messages';
import { ScanHistoryComponent } from './scan-history.component';
import { ScanResultComponent } from './scan-result.component';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

@Component({
  selector: 'app-dashboard',
  imports: [ScanHistoryComponent, ScanResultComponent],
  // Provided here so the Worker lives as long as this page.
  providers: [ImageAnalysisService],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly scans = inject(ScanService);
  private readonly imageAnalysis = inject(ImageAnalysisService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  readonly user = this.auth.user;
  readonly history = signal<Scan[]>([]);
  readonly isLoadingHistory = signal(true);
  readonly isProcessing = signal(false);
  readonly preview = signal<string | null>(null);
  readonly result = signal<ScanResult | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.releasePreview());
    this.loadHistory();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // without this, choosing the same photo again does not fire the event
    if (!file) return;

    const problem = this.validateFile(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.error.set(null);
    this.result.set(null);
    this.isProcessing.set(true);
    this.releasePreview();
    this.preview.set(URL.createObjectURL(file));

    try {
      this.saveScan(await this.imageAnalysis.analyze(file));
    } catch (err) {
      this.isProcessing.set(false);
      this.error.set(this.analysisErrorMessage(err));
    }
  }

  logOut(): void {
    this.auth.logOut();
    this.router.navigate(['/login']);
  }

  private loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.scans
      .getHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (scans) => {
          this.history.set(scans);
          this.isLoadingHistory.set(false);
        },
        error: (err) => {
          this.isLoadingHistory.set(false);
          this.error.set(this.language.httpError(err, 'scanLoadError'));
        }
      });
  }

  private saveScan({ categoryKey, confidence, widthPx, heightPx, compressedImageBase64 }: AnalysisResult): void {
    this.scans
      .create({ categoryKey, confidence, widthPx, heightPx, imageBase64: compressedImageBase64 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.result.set(response);
          this.isProcessing.set(false);
          this.auth.updatePoints(response.totalPoints);
          this.loadHistory();
        },
        error: (err) => {
          this.isProcessing.set(false);
          this.error.set(this.language.httpError(err, 'saveScanError'));
        }
      });
  }

  /** Some systems do not report the type of certain photos: in that case the Worker decides. */
  private validateFile(file: File): string | null {
    if (file.type && !file.type.startsWith('image/')) return this.language.t('imageNotSupported');
    if (file.size > MAX_FILE_SIZE_BYTES) return this.language.t('imageTooHeavy');
    return null;
  }

  private analysisErrorMessage(err: unknown): string {
    if (!(err instanceof ImageAnalysisError)) return this.language.t('imageError');

    switch (err.reason) {
      case 'unsupported':
        return this.language.t('workerError');
      case 'timed-out':
        return this.language.t('imageTimeout');
      case 'worker-crashed':
        return this.language.t('imageError');
      case 'invalid-image':
        return `${this.language.t('imageError')} ${err.message}`;
    }
  }

  /** Object URLs keep the image in memory until they are revoked. */
  private releasePreview(): void {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
  }
}
