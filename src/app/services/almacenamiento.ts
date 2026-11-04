/**
 * localStorage puede lanzar errores si el navegador bloquea los datos del sitio.
 * Eso no debe impedir que la app funcione: solo se pierde lo que se iba a recordar.
 */
export const almacenamiento = {
  leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  },

  guardar(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      // Sin almacenamiento, el valor solo dura hasta recargar la página.
    }
  },

  borrar(clave: string): void {
    try {
      localStorage.removeItem(clave);
    } catch {
      // Si no se pudo leer, tampoco hay nada que borrar.
    }
  }
};
