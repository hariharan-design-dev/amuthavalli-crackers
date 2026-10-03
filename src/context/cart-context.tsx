"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Cart Item Reference (persisted structure)
 * Stores strictly the minimal client references: productId and quantity.
 * Prices and totals are NOT authoritative and remain server-calculated.
 */
export interface CartItemReference {
  productId: string;
  quantity: number;
}

export interface CartContextValue {
  /** Map of productId -> quantity */
  items: Record<string, number>;
  /** Total item count in cart */
  totalQuantity: number;
  /** Get quantity for a specific product */
  getItemQuantity: (productId: string) => number;
  /** Set absolute quantity for a product (0 removes item) */
  setQuantity: (productId: string, quantity: number) => void;
  /** Increment quantity by 1 */
  incrementQuantity: (productId: string) => void;
  /** Decrement quantity by 1 (removes item if quantity drops to 0) */
  decrementQuantity: (productId: string) => void;
  /** Remove product completely from cart */
  removeItem: (productId: string) => void;
  /** Clear all items from cart */
  clearCart: () => void;
}

const CART_STORAGE_KEY = "amu_customer_cart_v1";
const EMPTY_CART: Record<string, number> = {};

// In-memory store state for useSyncExternalStore
let currentCart: Record<string, number> = EMPTY_CART;
let isInitialized = false;
const listeners = new Set<() => void>();

function getSavedCart(): Record<string, number> {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const map: Record<string, number> = {};
        for (const entry of parsed) {
          if (
            entry &&
            typeof entry.productId === "string" &&
            typeof entry.quantity === "number" &&
            entry.quantity > 0
          ) {
            map[entry.productId] = Math.min(1000, Math.floor(entry.quantity));
          }
        }
        return map;
      }
    }
  } catch (e) {
    console.warn("[CartProvider] Failed to parse cart from localStorage:", e);
  }
  return EMPTY_CART;
}

function saveCart(cart: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    const arrayToSave: CartItemReference[] = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(arrayToSave));
  } catch (e) {
    console.warn("[CartProvider] Failed to save cart to localStorage:", e);
  }
}

function initCartIfNeeded() {
  if (typeof window !== "undefined" && !isInitialized) {
    currentCart = getSavedCart();
    isInitialized = true;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function updateCart(updater: (prev: Record<string, number>) => Record<string, number>) {
  initCartIfNeeded();
  currentCart = updater(currentCart);
  saveCart(currentCart);
  listeners.forEach((listener) => listener());
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  initCartIfNeeded();

  const items = useSyncExternalStore(
    subscribe,
    () => currentCart,
    () => EMPTY_CART
  );

  const getItemQuantity = useCallback(
    (productId: string) => items[productId] ?? 0,
    [items]
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const validQty = isNaN(quantity) || quantity <= 0 ? 0 : Math.min(1000, Math.floor(quantity));
    updateCart((prev) => {
      if (validQty === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: validQty,
      };
    });
  }, []);

  const incrementQuantity = useCallback(
    (productId: string) => {
      const current = items[productId] ?? 0;
      setQuantity(productId, current + 1);
    },
    [items, setQuantity]
  );

  const decrementQuantity = useCallback(
    (productId: string) => {
      const current = items[productId] ?? 0;
      if (current <= 1) {
        setQuantity(productId, 0);
      } else {
        setQuantity(productId, current - 1);
      }
    },
    [items, setQuantity]
  );

  const removeItem = useCallback((productId: string) => {
    updateCart((prev) => {
      if (!(productId in prev)) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    updateCart(() => ({}));
  }, []);

  const totalQuantity = useMemo(() => {
    return Object.values(items).reduce((acc, qty) => acc + qty, 0);
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQuantity,
      getItemQuantity,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalQuantity,
      getItemQuantity,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
