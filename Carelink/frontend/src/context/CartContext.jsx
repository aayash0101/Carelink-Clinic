import { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './Auth.jsx'
import { toast } from 'react-toastify'
import { CART_LIST, CART_ADD, CART_UPDATE, CART_REMOVE, CART_CLEAR } from '../services/endpoints'

const CartContext = createContext()
export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  // ✅ Safety: Initialize with empty array to prevent "map of null" errors
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  // ✅ Only fetch cart if user is logged in
  useEffect(() => {
    if (isAuthenticated) fetchCart()
    else {
        setCart({ items: [], total: 0 })
        setLoading(false)
    }
  }, [isAuthenticated])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(CART_LIST)
      if (data.success) {
        setCart(data.data.cart || { items: [], total: 0 })
      }
    } catch (error) {
      setCart({ items: [], total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId, quantity = 1, variant = {}) => {
    try {
      // ✅ Use the correct backend route: /cart
      const { data } = await api.post(CART_ADD, { productId, quantity, variant })
      setCart(data.data.cart)
      return { success: true } // ✅ Essential for ProductPage handleAddToCart
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add'
      toast.error(msg)
      return { success: false, error: msg }
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    try {
      // ✅ Use correct route: /cart/:id
      const { data } = await api.put(CART_UPDATE(itemId), { quantity })
      setCart(data.data.cart)
      return { success: true }
    } catch (error) {
      toast.error('Update failed')
      return { success: false }
    }
  }

  const removeFromCart = async (itemId) => {
    try {
      // ✅ Use correct route: /cart/:id
      const { data } = await api.delete(CART_REMOVE(itemId))
      setCart(data.data.cart)
      return { success: true } // ✅ Essential for CartPage handleRemove
    } catch (error) {
      toast.error('Remove failed')
      return { success: false }
    }
  }

  const clearCart = async () => {
    try {
      await api.delete(CART_CLEAR)
      setCart({ items: [], total: 0 })
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }

  const getCartItemCount = () => cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
  
  const getCartTotal = () => cart?.items?.reduce((total, item) => {
    return item.product ? total + (item.product.price * item.quantity) : total
  }, 0) || 0

  return (
    <CartContext.Provider value={{
      cart, loading, addToCart, updateCartItem, removeFromCart, clearCart, getCartItemCount, getCartTotal, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

