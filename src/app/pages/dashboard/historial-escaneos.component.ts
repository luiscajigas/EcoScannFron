import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Escaneo } from '../../models/models';
import { LanguageService } from '../../services/language.service';

/** Componente de presentación: los datos los carga la página. */
@Component({
  selector: 'app-historial-escaneos',
  templateUrl: './historial-escaneos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialEscaneosComponent {
  readonly idioma = inject(LanguageService);
  readonly escaneos = input.required<Escaneo[]>();
  readonly cargando = input.required<boolean>();
}
