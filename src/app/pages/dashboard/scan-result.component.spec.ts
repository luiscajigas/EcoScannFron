import { TestBed } from '@angular/core/testing';
import { ScanResult } from '../../models/models';
import { ScanResultComponent } from './scan-result.component';

const RESULT: ScanResult = {
  id: 1,
  category: { key: 'plastic', name: 'Plástico', instructions: 'x', binColor: 'white' },
  source: 'ai',
  confidence: 0.9,
  pointsAwarded: 15,
  totalPoints: 30
};

describe('ScanResultComponent', () => {
  function render(result: ScanResult): HTMLElement {
    const fixture = TestBed.createComponent(ScanResultComponent);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('shows the category, the bin and the points', () => {
    const view = render(RESULT);
    expect(view.querySelector('h2')?.textContent).toContain('Plástico');
    expect(view.querySelector('.bin--white')).not.toBeNull();
    expect(view.querySelector('.points')?.textContent).toContain('30');
  });

  it('does not show the notice if AI classified it', () => {
    expect(render(RESULT).querySelector('.ai-notice')).toBeNull();
  });

  it('warns if the heuristic was used', () => {
    expect(render({ ...RESULT, source: 'heuristic' }).querySelector('.ai-notice')).not.toBeNull();
  });
});
