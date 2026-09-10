import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('svkm_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    // Default demo student
    return {
      id: 2,
      name: "Aarav Shah",
      email: "student@svkm.edu",
      role: "student", // 'student' | 'teacher' | 'admin'
      food_pref: "jain", // 'jain' | 'normal'
      canteen: "ground", // 'ground' | '6th_floor' | '8th_floor'
      loyalty_count: 4, // Only 1 more order needed for reward!
      svkm_coins: 40 // Starting demo balance
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('svkm_token') || 'demo-token');

  // Sync user coins live with backend
  useEffect(() => {
    if (!user?.id) return;
    fetch(`http://localhost:5000/api/users/${user.id}/coins`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.coins === 'number') {
          setUser(prev => prev ? { ...prev, svkm_coins: data.coins } : prev);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('svkm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('svkm_user');
    }
  }, [user]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('svkm_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('svkm_user');
    localStorage.removeItem('svkm_token');
  };

  const updatePreferences = (updates) => {
    setUser(prev => ({
      ...prev,
      ...updates
    }));
  };

  const incrementLoyalty = () => {
    setUser(prev => {
      if (!prev) return prev;
      const nextCount = (prev.loyalty_count || 0) + 1;
      return {
        ...prev,
        loyalty_count: nextCount
      };
    });
  };

  const awardCoins = (amount) => {
    if (!amount) return;
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        svkm_coins: (prev.svkm_coins || 0) + amount
      };
    });
  };

  const spendCoins = (amount) => {
    if (!amount) return;
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        svkm_coins: Math.max(0, (prev.svkm_coins || 0) - amount)
      };
    });
  };

  const setUserCoins = (coins) => {
    setUser(prev => prev ? { ...prev, svkm_coins: coins } : prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      updatePreferences,
      incrementLoyalty,
      awardCoins,
      spendCoins,
      setUserCoins,
      userCoins: user?.svkm_coins || 0,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
