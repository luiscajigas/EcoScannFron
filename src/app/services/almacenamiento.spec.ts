import { almacenamiento } from './almacenamiento';

describe('almacenamiento', () => {
  afterEach(() => localStorage.clear());

  it('guarda, lee y borra', () => {
    almacenamiento.guardar('clave', 'valor');
    expect(almacenamiento.leer('clave')).toBe('valor');
    almacenamiento.borrar('clave');
    expect(almacenamiento.leer('clave')).toBeNull();
  });

  it('no lanza errores si el navegador bloquea el almacenamiento', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado');
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado');
    spyOn(Storage.prototype, 'removeItem').and.throwError('bloqueado');

    expect(almacenamiento.leer('clave')).toBeNull();
    expect(() => almacenamiento.guardar('clave', 'valor')).not.toThrow();
    expect(() => almacenamiento.borrar('clave')).not.toThrow();
  });
});
