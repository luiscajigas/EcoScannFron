import { TestBed } from '@angular/core/testing';
import { Scan } from '../../models/models';
import { ScanHistoryComponent } from './scan-history.component';

const SCAN: Scan = {
  id: 1,
  categoryKey: 'metal',
  categoryName: 'Metal',
  instructions: 'x',
  binColor: 'white',
  confidence: 0.8,
  source: 'ai',
  pointsAwarded: 15,
  createdAt: '2026-11-04T00:00:00.000Z'
};

describe('ScanHistoryComponent', () => {
  function render(scans: Scan[], isLoading: boolean): HTMLElement {
    const fixture = TestBed.createComponent(ScanHistoryComponent);
    fixture.componentRef.setInput('scans', scans);
    fixture.componentRef.setInput('isLoading', isLoading);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('does not show the list while loading', () => {
    const view = render([], true);
    expect(view.querySelector('.empty-state')?.textContent).toContain('Cargando');
    expect(view.querySelector('ul')).toBeNull();
  });

  it('shows the empty message without scans', () => {
    const view = render([], false);
    expect(view.querySelector('.empty-state')?.textContent).toContain('Aún no hay');
    expect(view.querySelector('ul')).toBeNull();
  });

  it('shows one row per scan', () => {
    const view = render([SCAN, { ...SCAN, id: 2 }], false);
    expect(view.querySelectorAll('li').length).toBe(2);
    expect(view.querySelector('.empty-state')).toBeNull();
    expect(view.querySelector('.history__count')?.textContent).toContain('2');
  });
});
