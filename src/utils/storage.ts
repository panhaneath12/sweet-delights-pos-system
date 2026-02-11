import type { User, CashSession, Category, Product, Order, SyncEvent } from '../types';

// LocalStorage keys
const KEYS = {
  USERS: 'pos_users',
  SESSIONS: 'pos_sessions',
  CATEGORIES: 'pos_categories',
  PRODUCTS: 'pos_products',
  ORDERS: 'pos_orders',
  SYNC_QUEUE: 'pos_sync_queue',
  CURRENT_USER: 'pos_current_user',
  CURRENT_SESSION: 'pos_current_session',
  DEVICE_NAME: 'pos_device_name',
};

// Generic storage functions
export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  set(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// Specific data access functions
export const getUsers = (): User[] => storage.get<User[]>(KEYS.USERS) || [];
export function setUsers(users: any[]) {
  localStorage.setItem("pos_users", JSON.stringify(users));
}

export const getSessions = (): CashSession[] => storage.get<CashSession[]>(KEYS.SESSIONS) || [];
export const setSessions = (sessions: CashSession[]) => storage.set(KEYS.SESSIONS, sessions);

export const getCategories = (): Category[] => storage.get<Category[]>(KEYS.CATEGORIES) || [];
export const setCategories = (categories: Category[]) => storage.set(KEYS.CATEGORIES, categories);

export const getProducts = (): Product[] => storage.get<Product[]>(KEYS.PRODUCTS) || [];
export const setProducts = (products: Product[]) => storage.set(KEYS.PRODUCTS, products);

export const getOrders = (): Order[] => storage.get<Order[]>(KEYS.ORDERS) || [];
export const setOrders = (orders: Order[]) => storage.set(KEYS.ORDERS, orders);

export const getSyncQueue = (): SyncEvent[] => storage.get<SyncEvent[]>(KEYS.SYNC_QUEUE) || [];
export const setSyncQueue = (queue: SyncEvent[]) => storage.set(KEYS.SYNC_QUEUE, queue);

export const getCurrentUser = (): User | null => storage.get<User>(KEYS.CURRENT_USER);
export const setCurrentUser = (user: User | null) => user ? storage.set(KEYS.CURRENT_USER, user) : storage.remove(KEYS.CURRENT_USER);

export const getCurrentSession = (): CashSession | null => storage.get<CashSession>(KEYS.CURRENT_SESSION);
export const setCurrentSession = (session: CashSession | null) => session ? storage.set(KEYS.CURRENT_SESSION, session) : storage.remove(KEYS.CURRENT_SESSION);

export const getDeviceName = (): string => storage.get<string>(KEYS.DEVICE_NAME) || 'POS Terminal 1';
export const setDeviceName = (name: string) => storage.set(KEYS.DEVICE_NAME, name);

// Add to sync queue
export const addToSyncQueue = (type: string, payload: any) => {
  const queue = getSyncQueue();
  const event: SyncEvent = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  queue.push(event);
  setSyncQueue(queue);
};
