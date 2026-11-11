import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import L from 'leaflet';
import { LanguageService } from '../../services/language.service';
import { TranslationKey } from '../../i18n/translations';

interface EcoPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  detail: TranslationKey;
}

@Component({
  selector: 'app-eco-points',
  templateUrl: './eco-points.component.html',
  styleUrl: './eco-points.component.css'
})
export class EcoPointsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map', { static: true }) private mapElement!: ElementRef<HTMLDivElement>;

  readonly language = inject(LanguageService);
  readonly mapFailed = signal(false);
  readonly points: EcoPoint[] = [
    { id: 'jumbo-unicentro', name: 'Jumbo Unicentro', latitude: 1.205761, longitude: -77.278463, detail: 'ecoPointJumbo' },
    { id: 'alkosto-centro', name: 'Alkosto Centro', latitude: 1.21824, longitude: -77.27977, detail: 'ecoPointAlkostoCentro' },
    { id: 'cesmag', name: 'Universidad CESMAG', latitude: 1.210514, longitude: -77.278433, detail: 'ecoPointCesmag' },
    { id: 'exito-panamericana', name: 'Éxito Panamericana', latitude: 1.20691, longitude: -77.28645, detail: 'ecoPointExito' },
    { id: 'alkosto-bolivar', name: 'Alkosto Bolívar', latitude: 1.2067, longitude: -77.2671, detail: 'ecoPointAlkostoBolivar' }
  ];

  private map?: import('leaflet').Map;
  private markers: import('leaflet').CircleMarker[] = [];
  private destroyed = false;

  ngAfterViewInit(): void {
    void this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.map?.remove();
  }

  focusPoint(point: EcoPoint): void {
    this.map?.flyTo([point.latitude, point.longitude], 16);
    this.markers.find((marker) => marker.getLatLng().lat === point.latitude && marker.getLatLng().lng === point.longitude)?.openPopup();
  }

  mapUrl(point: EcoPoint): string {
    return `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`;
  }

  private initializeMap(): void {
    try {
      const map = L.map(this.mapElement.nativeElement, { scrollWheelZoom: false });
      this.map = map;

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      tiles.on('tileerror', () => this.mapFailed.set(true));
      tiles.addTo(map);

      this.markers = this.points.map((point) => {
        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: 8,
          color: '#173a25',
          weight: 2,
          fillColor: '#a5e66e',
          fillOpacity: 0.95
        }).addTo(map);
        marker.bindPopup(() => `${point.name} — ${this.language.t(point.detail)}`);
        return marker;
      });

      const bounds = L.latLngBounds(this.points.map((point) => [point.latitude, point.longitude]));
      map.fitBounds(bounds.pad(0.18), { maxZoom: 14 });
      requestAnimationFrame(() => {
        if (!this.destroyed) map.invalidateSize();
      });
    } catch (error) {
      console.error('Could not initialize the ecological points map:', error);
      this.map?.remove();
      this.map = undefined;
      this.mapFailed.set(true);
    }
  }
}
