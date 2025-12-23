
export enum Category {
  ACCESORIOS = 'Accesorios',
  ACCESORIOS_TLF = 'Accesorios para Teléfonos',
  BOLSOS_CARTERAS = 'Bolsos y Carteras',
  BROCHAS_BORLAS = 'Brochas y Borlas',
  CABELLO = 'Cabello',
  CALZADO = 'Calzado',
  FAJAS = 'Fajas',
  HOGAR = 'Hogar',
  JUGUETES_ADULTOS = 'Juguetes para Adultos',
  LENCERIA = 'Lencería y Ropa Interior',
  MAQUILLAJE = 'Maquillaje',
  OTROS = 'Otros',
  PROTECTOR_SOLAR = 'Protector Solar',
  ROPA = 'Ropa',
  SKINCARE = 'Skincare',
  TECNOLOGIA = 'Tecnología',
  TRAJES_BANO = 'Trajes de Baño',
}

export enum PaymentMethod {
  EFECTIVO_USD = 'Divisa (Efectivo $)',
  EFECTIVO_BS = 'Efectivo (Bolívares)',
  PUNTO = 'Punto de Venta',
  PAGO_MOVIL = 'Pago Móvil',
  CREDITO = 'Crédito',
}

export interface Product {
  id: string;
  name: string;
  priceUsd: number;
  stock: number;
  category: Category;
  subcategory?: string;
  size?: string; // Talla/Variante
  costPrice?: number;        // Nuevo: Precio de Costo
  profitPercentage?: number; // Nuevo: Porcentaje de Ganancia
  barcode?: string;          // Nuevo: Código de Barras
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  totalUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  // Fields for credit
  clientName?: string;
  creditDate?: string;
  creditAmount?: number;
  isPaid?: boolean; // Nuevo: Estado del crédito
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  exchangeRate: number;
}
