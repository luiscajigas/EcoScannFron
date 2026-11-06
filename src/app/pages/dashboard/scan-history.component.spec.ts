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
  createdAt: '2026-11-04T15:30:00.000Z',
  thumbnail: 'data:image/jpeg;base64,AAAA'
};

describe('ScanHistoryComponent', () => {
  function render(scans: Scan[], isLoading: boolean, inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(ScanHistoryComponent);
    fixture.componentRef.setInput('scans', scans);
    fixture.componentRef.setInput('isLoading', isLoading);
    fixture.componentRef.setInput('totalCount', scans.length);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return { fixture, view: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => localStorage.clear());

  it('does not show the list while loading', () => {
    const { view } = render([], true);
    expect(view.querySelector('.empty-state')?.textContent).toContain('Cargando');
    expect(view.querySelector('ul')).toBeNull();
  });

  it('shows the empty message without scans', () => {
    const { view } = render([], false);
    expect(view.querySelector('.empty-state')?.textContent).toContain('Aún no hay');
  });

  it('shows another message when the filter has no scans', () => {
    const { view } = render([], false, { filter: 'glass' });
    expect(view.querySelector('.empty-state')?.textContent).toContain('esta categoría');
  });

  it('shows one row per scan with its date', () => {
    const { view } = render([SCAN, { ...SCAN, id: 2 }], false);
    expect(view.querySelectorAll('li').length).toBe(2);
    expect(view.querySelector('time')?.getAttribute('datetime')).toBe(SCAN.createdAt);
    expect(view.querySelector('time')?.textContent?.trim()).toContain('2026');
    expect(view.querySelector('.history__count')?.textContent).toContain('2');
  });

  it('shows the thumbnail, or a placeholder for older scans', () => {
    const { view } = render([SCAN, { ...SCAN, id: 2, thumbnail: null }], false);
    expect(view.querySelector('img.history__thumbnail')?.getAttribute('src')).toBe(SCAN.thumbnail);
    expect(view.querySelector('.history__thumbnail--empty')).not.toBeNull();
  });

  it('emits the selected filter, and null for all categories', () => {
    const { fixture, view } = render([SCAN], false);
    const emitted: unknown[] = [];
    fixture.componentInstance.filterChange.subscribe((value) => emitted.push(value));
    const select = view.querySelector('select')!;

    select.value = 'metal';
    select.dispatchEvent(new Event('change'));
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual(['metal', null]);
  });

  it('offers to load more only when there is more', () => {
    expect(render([SCAN], false).view.querySelector('.history__more')).toBeNull();

    const { fixture, view } = render([SCAN], false, { hasMore: true });
    let requested = false;
    fixture.componentInstance.loadMore.subscribe(() => (requested = true));
    view.querySelector<HTMLButtonElement>('.history__more')!.click();
    expect(requested).toBeTrue();
  });
});
