import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts in dark mode by default', () => {
    expect(TestBed.inject(ThemeService).isLight()).toBeFalse();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('recovers the saved theme', () => {
    localStorage.setItem('ecoscan_theme', 'light');
    expect(TestBed.inject(ThemeService).isLight()).toBeTrue();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('toggles the theme and remembers it', () => {
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    expect(theme.isLight()).toBeTrue();
    expect(localStorage.getItem('ecoscan_theme')).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');

    theme.toggle();
    expect(localStorage.getItem('ecoscan_theme')).toBe('dark');
  });
});
