import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ResultadoEscaneo } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Componente de presentación: solo muestra el resultado que recibe. */
@Component({
  selector: 'app-resultado-escaneo',
  templateUrl: './resultado-escaneo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultadoEscaneoComponent {
  readonly idioma = inject(LanguageService);
  readonly resultado = input.required<ResultadoEscaneo>();
}
