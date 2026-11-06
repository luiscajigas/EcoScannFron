import { TestBed } from '@angular/core/testing';
import { UserStats } from '../../models/models';
import { ScanStatsComponent } from './scan-stats.component';

const WEEK = ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];

const STATS: UserStats = {
  totalScans: 6,
  currentStreak: 1,
  longestStreak: 4,
  byCategory: [
    { categoryKey: 'plastic', count: 4 },
    { categoryKey: 'metal', count: 2 }
  ],
  lastSevenDays: WEEK.map((date, index) => ({ date, count: index === 6 ? 2 : index === 5 ? 1 : 0 }))
};

describe('ScanStatsComponent', () => {
  function render(stats: UserStats): HTMLElement {
    const fixture = TestBed.createComponent(ScanStatsComponent);
    fixture.componentRef.setInput('stats', stats);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('shows the totals and uses the singular for one day', () => {
    const tiles = Array.from(render(STATS).querySelectorAll('dd')).map((tile) => tile.textContent?.trim());
    expect(tiles).toEqual(['6', '1 día', '4 días']);
  });

  it('scales the bars against the largest category', () => {
    const bars = render(STATS).querySelectorAll<HTMLElement>('.category-chart__bar');
    expect(bars[0].style.width).toBe('100%');
    expect(bars[1].style.width).toBe('50%');
  });

  it('draws seven days and no bar on empty days', () => {
    const view = render(STATS);
    expect(view.querySelectorAll('.week-chart__day').length).toBe(7);
    const bars = view.querySelectorAll<HTMLElement>('.week-chart__bar');
    expect(bars.length).toBe(2);
    expect(bars[1].style.height).toBe('100%');
  });

  it('describes each day for screen readers', () => {
    const lastDay = render(STATS).querySelectorAll('.week-chart__day')[6];
    expect(lastDay.getAttribute('aria-label')).toContain('2 escaneos');
  });

  it('without scans it shows a message instead of empty charts', () => {
    const view = render({ ...STATS, totalScans: 0, byCategory: [], lastSevenDays: STATS.lastSevenDays.map((d) => ({ ...d, count: 0 })) });
    expect(view.querySelector('.stats__charts')).toBeNull();
    expect(view.querySelector('.empty-state')).not.toBeNull();
  });
});
