import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RankingEntry, WeeklyRanking } from '../../models/models';
import { LiveStatus, LiveUpdatesService } from '../../services/live-updates.service';
import { RankingComponent } from './ranking.component';

const entry = (position: number, name: string, isMe = false): RankingEntry => ({
  position,
  name,
  scans: 7 - position,
  points: (7 - position) * 15,
  isMe
});

const week = (entries: RankingEntry[], me?: RankingEntry): WeeklyRanking => ({
  weekStart: '2026-11-09',
  weekEnd: '2026-11-15',
  timeZone: 'America/Bogota',
  entries,
  ...(me ? { me } : {})
});

describe('RankingComponent', () => {
  const URL = `${environment.apiUrl}/rankings/weekly`;
  let fixture: ComponentFixture<RankingComponent>;
  let backend: HttpTestingController;
  let liveUpdates: Subject<void>;
  let connect: jasmine.Spy;

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const rows = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.ranking__row'));

  beforeEach(() => {
    liveUpdates = new Subject<void>();
    connect = jasmine.createSpy('connect');
    const fakeLive = { status: signal<LiveStatus>('live'), rankingUpdates: liveUpdates.asObservable(), connect };

    TestBed.configureTestingModule({
      imports: [RankingComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.overrideComponent(RankingComponent, { set: { providers: [{ provide: LiveUpdatesService, useValue: fakeLive }] } });
    fixture = TestBed.createComponent(RankingComponent);
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('loads the ranking, opens the live connection and shows the top five', () => {
    expect(connect).toHaveBeenCalled();
    backend.expectOne(URL).flush(week([entry(1, 'Beto'), entry(2, 'Caro', true), entry(3, 'Dani')]));
    fixture.detectChanges();

    expect(rows().length).toBe(3);
    expect(rows()[0].textContent).toContain('Beto');
    expect(rows()[1].classList).toContain('ranking__row--me');
    expect(text()).toContain('9 de noviembre');
    expect(text()).toContain('15 de noviembre');
    expect(text()).toContain('En vivo');
    expect(text()).not.toContain('Tu posición');
  });

  it('shows the own position when the user is outside the top five', () => {
    const top = [1, 2, 3, 4, 5].map((position) => entry(position, `User ${position}`));
    backend.expectOne(URL).flush(week(top, { position: 8, name: 'Ana', scans: 1, points: 15, isMe: true }));
    fixture.detectChanges();

    expect(rows().length).toBe(5);
    expect(text()).toContain('Tu posición esta semana');
    expect(text()).toContain('#8');
  });

  it('shows an empty state when nobody has scanned this week', () => {
    backend.expectOne(URL).flush(week([]));
    fixture.detectChanges();
    expect(text()).toContain('Nadie ha escaneado esta semana');
  });

  it('reloads when the server says the ranking changed, keeping only the newest answer', () => {
    backend.expectOne(URL).flush(week([entry(1, 'Beto')]));

    liveUpdates.next();
    const stale = backend.expectOne(URL);
    liveUpdates.next();
    expect(stale.cancelled).toBeTrue();
    backend.expectOne(URL).flush(week([entry(1, 'Caro')]));
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Caro');
  });

  it('shows an error and recovers on the next update', () => {
    backend.expectOne(URL).flush({ code: 'INTERNAL_ERROR', message: 'x' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(text()).toContain('Ocurrió un error en el servidor');

    liveUpdates.next();
    backend.expectOne(URL).flush(week([entry(1, 'Beto')]));
    fixture.detectChanges();
    expect(rows().length).toBe(1);
  });
});
