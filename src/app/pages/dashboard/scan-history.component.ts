import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CategoryKey, Scan } from '../../models/models';
import { CATEGORY_KEYS, LanguageService } from '../../services/language.service';

/** Presentational component: the page loads the data and reacts to the outputs. */
@Component({
  selector: 'app-scan-history',
  templateUrl: './scan-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanHistoryComponent {
  readonly language = inject(LanguageService);
  readonly categoryKeys = CATEGORY_KEYS;

  readonly scans = input.required<Scan[]>();
  readonly isLoading = input.required<boolean>();
  readonly totalCount = input.required<number>();
  readonly filter = input<CategoryKey | null>(null);
  readonly hasMore = input(false);
  readonly isLoadingMore = input(false);

  readonly filterChange = output<CategoryKey | null>();
  readonly loadMore = output<void>();

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit(value ? (value as CategoryKey) : null);
  }
}
