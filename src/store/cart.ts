"use client"

import { create } from "zustand"
import type { Cart } from "@/types"
import {
  addLineItem,
  getCart,
  removeLineItem,
  updateLineItem,
  clearLocalCart,
} from "@/lib/cart-client"

interface CartState {
  cart: Cart | null
  isOpen: boolean
  isLoading: boolean
  hasHydrated: boolean

  // UI
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  // Server-backed operations
  hydrate: () => Promise<void>
  addItem: (
    variantId: string,
    quantity?: number,
    countryCode?: string
  ) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clear: () => Promise<void>

  // Selectors (kept for backwards compat with existing UI)
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  hasHydrated: false,

  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  hydrate: async () => {
    if (get().hasHydrated) return
    set({ isLoading: true })
    try {
      const cart = await getCart()
      set({ cart, hasHydrated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (variantId, quantity = 1, countryCode) => {
    set({ isLoading: true })
    try {
      const cart = await addLineItem(variantId, quantity, countryCode)
      set({ cart, hasHydrated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  updateQuantity: async (lineItemId, quantity) => {
    set({ isLoading: true })
    try {
      const cart = await updateLineItem(lineItemId, quantity)
      set({ cart })
    } finally {
      set({ isLoading: false })
    }
  },

  removeItem: async (lineItemId) => {
    set({ isLoading: true })
    try {
      const cart = await removeLineItem(lineItemId)
      set({ cart })
    } finally {
      set({ isLoading: false })
    }
  },

  clear: async () => {
    clearLocalCart()
    set({ cart: null })
  },

  getSubtotal: () => get().cart?.subtotal ?? 0,
  getItemCount: () => get().cart?.itemCount ?? 0,
}))
