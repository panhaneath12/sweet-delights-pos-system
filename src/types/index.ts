export type UserRole = 'ADMIN' | 'CASHIER';

export type User = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "CASHIER";
  active: boolean;

  // Option B: offline PIN verification (no plain PIN stored)
  pinHash?: string;     // base64
  pinSalt?: string;     // base64
  pinIter?: number;     // e.g. 120000
};


export type CashSession = {
  id: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  note?: string;
  status: 'OPEN' | 'CLOSED';
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  extraPrice: number;
  active: boolean;
  type: 'SIZE' | 'FLAVOR' | 'TOPPING';
};

export type Product = {
  id: string;
  name: string;
  basePrice: number;
  categoryId: string;
  image?: string;
  active: boolean;
  variants?: ProductVariant[];
};

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PREORDER';
export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  variants: ProductVariant[];
  note?: string;
  lineDiscount?: number;
  lineTotal: number;
};

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'BANK';

export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
};

export type Order = {
  id: string;
  orderNo: string;
  sessionId: string;
  cashierId: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Payment[];
  note?: string;
  pickupTime?: string | null;
  createdAt: string;
  printedAt?: string | null;

  // ✅ for offline-first sync
  synced?: boolean;
};


export type SyncEvent = {
  id: string;
  type: string;
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
};

export type ConnectionStatus = 'online' | 'offline' | 'syncing';
