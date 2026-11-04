/**
 * localStorage can throw errors if the browser blocks the site's data. That must
 * not stop the app from working: only what it wanted to remember is lost.
 */
export const safeStorage = {
  read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Without storage, the value only lasts until the page reloads.
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // If it could not be read, there is nothing to remove either.
    }
  }
};
