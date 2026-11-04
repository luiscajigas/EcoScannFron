import { safeStorage } from './storage';

describe('safeStorage', () => {
  afterEach(() => localStorage.clear());

  it('writes, reads and removes', () => {
    safeStorage.write('key', 'value');
    expect(safeStorage.read('key')).toBe('value');
    safeStorage.remove('key');
    expect(safeStorage.read('key')).toBeNull();
  });

  it('does not throw if the browser blocks storage', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'removeItem').and.throwError('blocked');

    expect(safeStorage.read('key')).toBeNull();
    expect(() => safeStorage.write('key', 'value')).not.toThrow();
    expect(() => safeStorage.remove('key')).not.toThrow();
  });
});
