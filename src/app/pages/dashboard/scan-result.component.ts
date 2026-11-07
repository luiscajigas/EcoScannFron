import { ChangeDetectionStrategy, Component, inject, input, ViewEncapsulation } from '@angular/core';
import { ScanResult } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Presentational component: it only shows the result it receives. */
@Component({
  selector: 'app-scan-result',
  templateUrl: './scan-result.component.html',
  styleUrl: './scan-result.component.css',
  // Without encapsulation: its styles share the design tokens and light theme rules of the page.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScanResultComponent {
  readonly language = inject(LanguageService);
  readonly result = input.required<ScanResult>();
}
