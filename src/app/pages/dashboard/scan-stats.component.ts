import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { UserStats } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Presentational component: draws the statistics the page loads. */
@Component({
  selector: 'app-scan-stats',
  templateUrl: './scan-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanStatsComponent {
  readonly language = inject(LanguageService);
  readonly stats = input.required<UserStats>();

  private readonly maxCategoryCount = computed(() => Math.max(1, ...this.stats().byCategory.map((c) => c.count)));
  private readonly maxDayCount = computed(() => Math.max(1, ...this.stats().lastSevenDays.map((d) => d.count)));

  categoryPercent(count: number): number {
    return (count / this.maxCategoryCount()) * 100;
  }

  dayPercent(count: number): number {
    return (count / this.maxDayCount()) * 100;
  }

  days(count: number): string {
    return `${count} ${this.language.t(count === 1 ? 'statsDayOne' : 'statsDayMany')}`;
  }

  scans(count: number): string {
    return `${count} ${this.language.t(count === 1 ? 'scanOne' : 'scanMany')}`;
  }
}
