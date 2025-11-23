export interface Product {
  id: string;
  title: string;
  price: number;
  category_id?: string;
  image_url?: string;
  sku?: string;
  stock?: number;
  barcode?: string;
  status?: string;
  user_id?: string;
  created_at?: string;
  description?: string;
  location_id?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'amount';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface Payment {
  method: 'cash' | 'evc_plus' | 'zaad' | 'waffi' | 'edahab';
  amount: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer?: Customer;
  payments: Payment[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  total: number;
  cashier: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'parked';
  note?: string;
}
