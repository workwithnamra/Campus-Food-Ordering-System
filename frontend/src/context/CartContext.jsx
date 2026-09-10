import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userCoins } = useAuth();

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('svkm_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            const customs = item.selectedCustomizations || [];
            const customTotal = customs.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
            const unitPrice = Number(item.unitPrice) || ((Number(item.price) || 0) + customTotal);
            const key = item.cartKey || `${item.id}-${customs.map(c => c.name).sort().join('|')}`;
            return {
              ...item,
              cartKey: key,
              unitPrice,
              qty: Math.max(1, Number(item.qty) || 1),
              selectedCustomizations: customs
            };
          });
        }
      } catch (e) { }
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemCoins, setRedeemCoins] = useState(false);

  useEffect(() => {
    localStorage.setItem('svkm_cart', JSON.stringify(cart));
  }, [cart]);

  // Helper to generate unique cart item key based on item ID and customizations
  const getItemKey = (item, customizations = []) => {
    const customKey = customizations.map(c => c.name).sort().join('|');
    return `${item.id}-${customKey}`;
  };

  const addToCart = (item, selectedCustomizations = []) => {
    const key = getItemKey(item, selectedCustomizations);
    const customTotal = selectedCustomizations.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const unitPrice = (Number(item.price) || 0) + customTotal;

    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.cartKey === key);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            ...item,
            cartKey: key,
            qty: 1,
            unitPrice,
            selectedCustomizations
          }
        ];
      }
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartKey === cartKey || String(item.id) === String(cartKey)) {
          const newQty = (Number(item.qty) || 1) + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey && String(item.id) !== String(cartKey)));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setRedeemCoins(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.unitPrice) || 0) * (Number(item.qty) || 1)), 0);

  // 1. Coupon Discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_percent) {
      couponDiscount = (subtotal * Number(appliedCoupon.discount_percent)) / 100;
      if (appliedCoupon.max_discount) couponDiscount = Math.min(couponDiscount, Number(appliedCoupon.max_discount));
    } else if (appliedCoupon.discount_flat) {
      couponDiscount = Number(appliedCoupon.discount_flat) || 0;
    }
    couponDiscount = Math.min(couponDiscount, subtotal);
  }

  // 2. SVKM Coins calculation (10 Coins = ₹10, capped at remaining total so total >= 0)
  const remainingAfterCoupon = Math.max(0, subtotal - couponDiscount);
  let coinDiscount = 0;
  let coinsRedeemedCount = 0;

  if (redeemCoins && Number(userCoins) > 0) {
    coinsRedeemedCount = Math.min(Number(userCoins), remainingAfterCoupon);
    coinDiscount = coinsRedeemedCount; // 1:1 value (1 coin = ₹1)
  }

  const discount = Math.min(subtotal, (couponDiscount || 0) + (coinDiscount || 0));
  const grandTotal = Math.max(0, subtotal - discount);
  const totalItemCount = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);

  // Coins that will be earned on this order: 1 SVKM Coin for every ₹20 spent
  const coinsToEarn = Math.floor(grandTotal / 20);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      discount,
      couponDiscount,
      coinDiscount,
      coinsRedeemedCount,
      coinsToEarn,
      grandTotal,
      totalItemCount,
      appliedCoupon,
      setAppliedCoupon,
      redeemCoins,
      setRedeemCoins
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
