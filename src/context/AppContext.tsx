import type { InventoryItem, Order, OrderStatus, Product } from '@/@types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ORDERS_KEY = '@bakery_orders';
const PRODUCTS_KEY = '@bakery_products';
const INVENTORY_KEY = '@bakery_inventory';

const SAMPLE_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pão Francês', category: 'Pães', price: 0.75, available: true, description: 'Pão tradicional crocante' },
  { id: 'p2', name: 'Pão de Queijo', category: 'Pães', price: 3.50, available: true, description: 'Pão de queijo mineiro' },
  { id: 'p3', name: 'Croissant', category: 'Pães', price: 7.00, available: true, description: 'Croissant amanteigado' },
  { id: 'p4', name: 'Brigadeiro', category: 'Doces', price: 4.50, available: true, description: 'Brigadeiro gourmet' },
  { id: 'p5', name: 'Coxinha', category: 'Salgados', price: 6.00, available: true, description: 'Coxinha de frango' },
  { id: 'p6', name: 'Bolo de Chocolate', category: 'Bolos', price: 45.00, available: true, description: 'Bolo inteiro' },
  { id: 'p7', name: 'Quindim', category: 'Doces', price: 5.00, available: false, description: 'Quindim tradicional' },
  { id: 'p8', name: 'Café Expresso', category: 'Bebidas', price: 5.00, available: true, description: 'Café expresso duplo' },
  { id: 'p9', name: 'Empada', category: 'Salgados', price: 5.50, available: true, description: 'Empada de palmito' },
  { id: 'p10', name: 'Torta de Limão', category: 'Bolos', price: 55.00, available: true, description: 'Torta de limão siciliano' },
];

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'o1',
    customerName: 'Maria Silva',
    items: [
      { productId: 'p1', productName: 'Pão Francês', quantity: 10, price: 0.75 },
      { productId: 'p4', productName: 'Brigadeiro', quantity: 2, price: 4.50 },
    ],
    total: 16.50,
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'o2',
    customerName: 'João Santos',
    items: [
      { productId: 'p6', productName: 'Bolo de Chocolate', quantity: 1, price: 45.00 },
    ],
    total: 45.00,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    note: 'Entrega às 18h',
  },
  {
    id: 'o3',
    customerName: 'Ana Pereira',
    items: [
      { productId: 'p3', productName: 'Croissant', quantity: 3, price: 7.00 },
      { productId: 'p8', productName: 'Café Expresso', quantity: 2, price: 5.00 },
    ],
    total: 31.00,
    status: 'ready',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'o4',
    customerName: 'Carlos Lima',
    items: [
      { productId: 'p5', productName: 'Coxinha', quantity: 6, price: 6.00 },
      { productId: 'p9', productName: 'Empada', quantity: 4, price: 5.50 },
    ],
    total: 58.00,
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'o5',
    customerName: 'Fernanda Costa',
    items: [
      { productId: 'p10', productName: 'Torta de Limão', quantity: 1, price: 55.00 },
      { productId: 'p2', productName: 'Pão de Queijo', quantity: 4, price: 3.50 },
    ],
    total: 69.00,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    note: 'Sem açúcar na torta',
  },
];

const SAMPLE_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Farinha de Trigo', quantity: 8, unit: 'kg', minQuantity: 10, category: 'Farinhas' },
  { id: 'i2', name: 'Açúcar Refinado', quantity: 15, unit: 'kg', minQuantity: 5, category: 'Adoçantes' },
  { id: 'i3', name: 'Manteiga', quantity: 3, unit: 'kg', minQuantity: 5, category: 'Laticínios' },
  { id: 'i4', name: 'Ovos', quantity: 60, unit: 'un', minQuantity: 30, category: 'Proteínas' },
  { id: 'i5', name: 'Leite Integral', quantity: 12, unit: 'L', minQuantity: 10, category: 'Laticínios' },
  { id: 'i6', name: 'Fermento Biológico', quantity: 2, unit: 'kg', minQuantity: 3, category: 'Fermentos' },
  { id: 'i7', name: 'Chocolate em Pó', quantity: 5, unit: 'kg', minQuantity: 3, category: 'Coberturas' },
  { id: 'i8', name: 'Sal Refinado', quantity: 10, unit: 'kg', minQuantity: 2, category: 'Temperos' },
  { id: 'i9', name: 'Óleo de Soja', quantity: 4, unit: 'L', minQuantity: 5, category: 'Óleos' },
  { id: 'i10', name: 'Creme de Leite', quantity: 6, unit: 'un', minQuantity: 4, category: 'Laticínios' },
];

interface AppContextType {
  orders: Order[];
  products: Product[];
  inventory: InventoryItem[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateInventoryQuantity: (id: string, quantity: number) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedOrders, storedProducts, storedInventory] = await Promise.all([
          AsyncStorage.getItem(ORDERS_KEY),
          AsyncStorage.getItem(PRODUCTS_KEY),
          AsyncStorage.getItem(INVENTORY_KEY),
        ]);
        setOrders(storedOrders ? JSON.parse(storedOrders) : SAMPLE_ORDERS);
        setProducts(storedProducts ? JSON.parse(storedProducts) : SAMPLE_PRODUCTS);
        setInventory(storedInventory ? JSON.parse(storedInventory) : SAMPLE_INVENTORY);
        if (!storedOrders) await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(SAMPLE_ORDERS));
        if (!storedProducts) await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(SAMPLE_PRODUCTS));
        if (!storedInventory) await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(SAMPLE_INVENTORY));
      } catch {
        setOrders(SAMPLE_ORDERS);
        setProducts(SAMPLE_PRODUCTS);
        setInventory(SAMPLE_INVENTORY);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: `o${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  }, [orders]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  }, [orders]);

  const deleteOrder = useCallback(async (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  }, [orders]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: `p${Date.now()}` };
    const updated = [newProduct, ...products];
    setProducts(updated);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  }, [products]);

  const updateProduct = useCallback(async (product: Product) => {
    const updated = products.map(p => p.id === product.id ? product : p);
    setProducts(updated);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  }, [products]);

  const toggleProductAvailability = useCallback(async (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, available: !p.available } : p);
    setProducts(updated);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
  }, [products]);

  const updateInventoryQuantity = useCallback(async (id: string, quantity: number) => {
    const updated = inventory.map(i => i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i);
    setInventory(updated);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
  }, [inventory]);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: `i${Date.now()}` };
    const updated = [newItem, ...inventory];
    setInventory(updated);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
  }, [inventory]);

  return (
    <AppContext.Provider value={{
      orders, products, inventory,
      addOrder, updateOrderStatus, deleteOrder,
      addProduct, updateProduct, toggleProductAvailability, deleteProduct,
      updateInventoryQuantity, addInventoryItem,
      isLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
