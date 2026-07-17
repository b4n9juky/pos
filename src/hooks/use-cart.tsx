"use client"

import { createContext, useContext, useReducer, useCallback, useMemo, useState, useEffect, type ReactNode } from "react"
import type { CartItem, Product } from "@/types"

interface CartState {
  items: CartItem[]
  discount: number
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "UPDATE_QUANTITY"; productId: number; quantity: number }
  | { type: "SET_DISCOUNT"; discount: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[]; discount: number }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.product.id === action.product.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: 1 }] }
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) }
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    }
    case "SET_DISCOUNT":
      return { ...state, discount: Math.max(0, action.discount) }
    case "CLEAR_CART":
      return { items: [], discount: 0 }
    case "LOAD_CART":
      return { items: action.items, discount: action.discount }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  discount: number
  subtotal: number
  taxableSubtotal: number
  tax: number
  total: number
  itemCount: number
  taxRate: number
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  setDiscount: (discount: number) => void
  clearCart: () => void
  loadCart: (items: CartItem[], discount: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], discount: 0 })
  const [taxRate, setTaxRate] = useState(10)

  useEffect(() => {
    fetch("/api/tax-settings/default")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate != null) setTaxRate(data.rate)
      })
      .catch(() => {})
  }, [])

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.items]
  )
  const taxableSubtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + (item.product.taxable ? item.product.price * item.quantity : 0), 0),
    [state.items]
  )
  const tax = useMemo(() => {
    return Math.round(state.items.reduce((sum, item) => {
      if (!item.product.taxable) return sum;
      const rate = item.product.taxRate != null ? item.product.taxRate : taxRate;
      return sum + (item.product.price * item.quantity * (rate / 100));
    }, 0))
  }, [state.items, taxRate])
  const total = useMemo(() => Math.max(0, subtotal + tax - state.discount), [subtotal, tax, state.discount])
  const itemCount = useMemo(() => state.items.reduce((sum, item) => sum + item.quantity, 0), [state.items])

  const addItem = useCallback((product: Product) => {
    dispatch({ type: "ADD_ITEM", product })
  }, [])

  const removeItem = useCallback((productId: number) => {
    dispatch({ type: "REMOVE_ITEM", productId })
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity })
  }, [])

  const setDiscount = useCallback((discount: number) => {
    dispatch({ type: "SET_DISCOUNT", discount })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" })
  }, [])

  const loadCart = useCallback((items: CartItem[], discount: number) => {
    dispatch({ type: "LOAD_CART", items, discount })
  }, [])

  const contextValue = useMemo(
    () => ({
      items: state.items,
      discount: state.discount,
      subtotal,
      taxableSubtotal,
      tax,
      total,
      itemCount,
      taxRate,
      addItem,
      removeItem,
      updateQuantity,
      setDiscount,
      clearCart,
      loadCart,
    }),
    [state.items, state.discount, subtotal, taxableSubtotal, tax, total, itemCount, taxRate, loadCart]
  )

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
