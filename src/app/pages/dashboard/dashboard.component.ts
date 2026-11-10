import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryKey, Scan, ScanResult, UserStats } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { ImageAnalysisError, ImageAnalysisService } from '../../services/image-analysis.service';
import { LanguageService } from '../../services/language.service';
import { ScanService } from '../../services/scan.service';
import { ThemeService } from '../../services/theme.service';
import { AnalysisResult } from '../../workers/analysis.messages';
import { EcoPointsComponent } from './eco-points.component';
import { ScanHistoryComponent } from './scan-history.component';
import { ScanResultComponent } from './scan-result.component';
import { ScanStatsComponent } from './scan-stats.component';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const HISTORY_PAGE_SIZE = 10;

@Component({
  selector: 'app-dashboard',
  imports: [EcoPointsComponent, ScanHistoryComponent, ScanResultComponent, ScanStatsComponent],
  // Provided here so the Worker lives as long as this page.
  providers: [ImageAnalysisService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  // Without encapsulation: its styles share the design tokens and light theme rules of the page.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly scans = inject(ScanService);
  private readonly imageAnalysis = inject(ImageAnalysisService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private historyRequest?: Subscription;
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  readonly user = this.auth.user;
  readonly history = signal<Scan[]>([]);
  readonly historyFilter = signal<CategoryKey | null>(null);
  readonly isLoadingHistory = signal(true);
  readonly isLoadingMoreHistory = signal(false);
  readonly hasMoreHistory = signal(false);
  readonly stats = signal<UserStats | null>(null);
  readonly hasStatsError = signal(false);
  readonly isProcessing = signal(false);
  readonly preview = signal<string | null>(null);
  readonly result = signal<ScanResult | null>(null);
  readonly error = signal<string | null>(null);

  /** Total scans for the current filter; the history only holds the loaded pages. */
  readonly historyCount = computed(() => {
    const stats = this.stats();
    if (!stats) return this.history().length;
    const filter = this.historyFilter();
    return filter ? stats.byCategory.find((c) => c.categoryKey === filter)?.count ?? 0 : stats.totalScans;
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.releasePreview());
    this.loadHistory();
    this.loadStats();
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

  onHistoryFilterChange(filter: CategoryKey | null): void {
    this.historyFilter.set(filter);
    this.loadHistory();
  }

  loadMoreHistory(): void {
    this.isLoadingMoreHistory.set(true);
    this.fetchHistory(this.history().length);
  }

  logOut(): void {
    this.auth.logOut();
    this.router.navigate(['/login']);
  }

  private loadHistory(): void {
    this.isLoadingHistory.set(true);
    this.fetchHistory(0);
  }

  private fetchHistory(offset: number): void {
    // Cancels the previous request so a slow response cannot overwrite a newer filter.
    this.historyRequest?.unsubscribe();
    this.historyRequest = this.scans
      // One extra row reveals whether there is another page.
      .getHistory({ limit: HISTORY_PAGE_SIZE + 1, offset, category: this.historyFilter() ?? undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (scans) => {
          const page = scans.slice(0, HISTORY_PAGE_SIZE);
          this.history.set(offset ? [...this.history(), ...page] : page);
          this.hasMoreHistory.set(scans.length > HISTORY_PAGE_SIZE);
          this.isLoadingHistory.set(false);
          this.isLoadingMoreHistory.set(false);
        },
        error: (err) => {
          this.isLoadingHistory.set(false);
          this.isLoadingMoreHistory.set(false);
          this.error.set(this.language.httpError(err, 'scanLoadError'));
        }
      });
  }

  private loadStats(): void {
    this.scans
      .getStats(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.hasStatsError.set(false);
        },
        error: () => this.hasStatsError.set(true)
      });
  }

  private saveScan({ categoryKey, confidence, widthPx, heightPx, compressedImageBase64, thumbnailBase64 }: AnalysisResult): void {
    this.scans
      .create({ categoryKey, confidence, widthPx, heightPx, imageBase64: compressedImageBase64, thumbnailBase64 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.result.set(response);
          this.isProcessing.set(false);
          this.auth.updatePoints(response.totalPoints);
          this.loadHistory();
          this.loadStats();
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
