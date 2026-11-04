import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    // El plan gratis de Render se duerme: este aviso lo despierta antes del login.
    this.http.get(`${environment.apiUrl}/salud`).subscribe({ error: () => undefined });
  }
}
