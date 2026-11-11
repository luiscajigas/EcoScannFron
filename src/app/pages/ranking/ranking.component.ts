import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, startWith, switchMap } from 'rxjs';
import { WeeklyRanking } from '../../models/models';
import { LanguageService } from '../../services/language.service';
import { LiveUpdatesService } from '../../services/live-updates.service';
import { ScanService } from '../../services/scan.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink],
  // Provided here so the WebSocket only stays open while this page is visible.
  providers: [LiveUpdatesService],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankingComponent implements OnInit {
  private readonly scans = inject(ScanService);
  private readonly destroyRef = inject(DestroyRef);
  readonly live = inject(LiveUpdatesService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);

  readonly ranking = signal<WeeklyRanking | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  /** The caller's row, shown apart only when it is not already in the top five. */
  readonly ownRowOutsideTop = computed(() => {
    const ranking = this.ranking();
    return ranking?.me && !ranking.entries.some((entry) => entry.isMe) ? ranking.me : null;
  });

  ngOnInit(): void {
    this.live.rankingUpdates
      .pipe(
        startWith(undefined),
        // A newer update cancels the request still in flight, so old data never wins.
        switchMap(() =>
          this.scans.getWeeklyRanking().pipe(
            catchError((err) => {
              this.isLoading.set(false);
              this.error.set(this.language.httpError(err, 'rankingLoadError'));
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((ranking) => {
        this.ranking.set(ranking);
        this.isLoading.set(false);
        this.error.set(null);
      });

    this.live.connect();
  }

  scansLabel(count: number): string {
    return `${count} ${this.language.t(count === 1 ? 'scanOne' : 'scanMany')}`;
  }
}
