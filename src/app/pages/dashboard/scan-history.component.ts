import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Scan } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Presentational component: the page loads the data. */
@Component({
  selector: 'app-scan-history',
  templateUrl: './scan-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanHistoryComponent {
  readonly language = inject(LanguageService);
  readonly scans = input.required<Scan[]>();
  readonly isLoading = input.required<boolean>();
}
