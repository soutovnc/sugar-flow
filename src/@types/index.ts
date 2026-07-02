export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  note?: string;
}

export type ProductCategory = 'Pães' | 'Doces' | 'Bolos' | 'Salgados' | 'Bebidas' | 'Outros';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  available: boolean;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  category: string;
}
