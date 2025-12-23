
import { Category } from './types';

export const SUBCATEGORIES: Record<string, string[]> = {
  [Category.ROPA]: ['Dama', 'Caballero', 'Niño'],
  [Category.CALZADO]: ['Dama', 'Caballero', 'Niño'],
  [Category.LENCERIA]: ['Dama', 'Caballero', 'Niño'],
  [Category.TRAJES_BANO]: ['Dama', 'Caballero', 'Niño'],
  [Category.ACCESORIOS]: ['Pulseras', 'Collares', 'Zarcillos', 'Anillos'],
};

// Categories that require the "Size/Variant" field
export const CATEGORIES_WITH_VARIANTS = [
  Category.ROPA,
  Category.CALZADO,
  Category.LENCERIA,
  Category.TRAJES_BANO
];

export const INITIAL_RATE = 45.00; // Default hypothetical rate

// Safe ID generator that works in non-secure contexts (HTTP) where crypto.randomUUID fails
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if context is not secure
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
