import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

/** Logo, name and language and theme switches shared by the login and registration pages. */
@Component({
  selector: 'app-auth-brand',
  templateUrl: './auth-brand.component.html',
  styles: ':host { display: block; }',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthBrandComponent {
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
}
