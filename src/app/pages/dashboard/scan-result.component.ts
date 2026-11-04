import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ScanResult } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Presentational component: it only shows the result it receives. */
@Component({
  selector: 'app-scan-result',
  templateUrl: './scan-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanResultComponent {
  readonly language = inject(LanguageService);
  readonly result = input.required<ScanResult>();
}
