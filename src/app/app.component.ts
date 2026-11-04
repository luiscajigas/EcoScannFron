import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    template: '<router-outlet></router-outlet>',
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: []
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // El plan gratis de Render se duerme: este aviso lo despierta antes del login.
    this.http.get(`${environment.apiUrl}/salud`).subscribe({ error: () => undefined });
  }
}
