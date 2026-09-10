const fs = require('fs');
const path = require('path');
const initialMenu = require('./itemsData');

const DB_FILE = path.join(__dirname, 'canteen_store.json');

// Initial default state
const defaultState = {
  users: [
    {
      id: 1,
      name: "SVKM Admin",
      email: "admin@svkm.edu",
      password: "admin", // in production use bcrypt
      role: "admin",
      canteen: "all",
      food_pref: "all",
      loyalty_count: 0
    },
    {
      id: 2,
      name: "Aarav Shah",
      email: "student@svkm.edu",
      password: "student",
      role: "student",
      canteen: "ground",
      food_pref: "jain",
      loyalty_count: 4 // Only 1 order away from a 5th order reward!
    },
    {
      id: 3,
      name: "Prof. Kothari",
      email: "teacher@svkm.edu",
      password: "teacher",
      role: "teacher",
      canteen: "6th_floor",
      food_pref: "jain",
      loyalty_count: 2
    }
  ],
  menu: initialMenu,
  orders: [
    {
      id: 101,
      order_code: "SVKM-9021",
      user_id: 2,
      user_name: "Aarav Shah",
      user_email: "student@svkm.edu",
      canteen_id: "ground",
      canteen_name: "Ground Floor Canteen",
      items: [
        {
          id: 12,
          name: "Jain Amul Butter Pav Bhaji",
          price: 140,
          qty: 1,
          selected_customizations: [{ name: "Extra Pav Jodi (2 pcs)", price: 20 }]
        },
        {
          id: 49,
          name: "Famous Mumbai Mara Mari Juice (Large)",
          price: 80,
          qty: 1,
          selected_customizations: [{ name: "No Added Sugar", price: 0 }]
        }
      ],
      subtotal: 240,
      discount: 0,
      total: 240,
      payment_method: "Razorpay UPI (Fast)",
      payment_status: "PAID",
      status: "Preparing", // Placed -> Preparing -> Ready -> Completed
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 102,
      order_code: "SVKM-8834",
      user_id: 3,
      user_name: "Prof. Kothari",
      user_email: "teacher@svkm.edu",
      canteen_id: "6th_floor",
      canteen_name: "6th Floor Faculty Canteen",
      items: [
        {
          id: 2,
          name: "Nylon Khaman Dhokla (Plate of 4)",
          price: 60,
          qty: 2,
          selected_customizations: []
        },
        {
          id: 70,
          name: "Jain Elaichi Kesar Chai (Kulhad, No Ginger)",
          price: 25,
          qty: 2,
          selected_customizations: []
        }
      ],
      subtotal: 170,
      discount: 20,
      total: 150,
      payment_method: "Counter UPI QR",
      payment_status: "PAID",
      status: "Ready",
      created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString()
    }
  ],
  coupons: [
    {
      id: 1,
      code: "SVKM50",
      description: "50% OFF up to ₹100 on all Jain & Gujarati dishes",
      discount_percent: 50,
      max_discount: 100,
      min_order: 150,
      is_active: true
    },
    {
      id: 2,
      code: "LOYALTY5",
      description: "Special 5th Order Gift: Flat ₹60 OFF!",
      discount_flat: 60,
      min_order: 120,
      is_active: true
    },
    {
      id: 3,
      code: "FREESUSHI",
      description: "Free Veggie California Roll with 8th Floor orders over ₹300",
      discount_flat: 280,
      min_order: 400,
      is_active: true
    }
  ]
};

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.orders)) parsed.orders = defaultState.orders || [];
        if (!Array.isArray(parsed.coupons)) parsed.coupons = defaultState.coupons || [];
        if (!Array.isArray(parsed.users)) parsed.users = defaultState.users || [];
        // Ensure menu has items if empty
        if (!parsed.menu || parsed.menu.length === 0) {
          parsed.menu = initialMenu;
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read db file, initializing with defaults:", e.message);
    }
    this.save(defaultState);
    return defaultState;
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error saving DB:", e.message);
    }
  }

  // --- Users ---
  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === Number(id));
  }

  createUser(user) {
    const newUser = {
      id: Date.now(),
      loyalty_count: 0,
      food_pref: user.food_pref || 'normal',
      canteen: user.canteen || 'ground',
      ...user
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === Number(id));
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Menu ---
  getMenuItems(filters = {}) {
    let items = [...this.data.menu];

    if (filters.canteen && filters.canteen !== 'all') {
      items = items.filter(i => i.canteen_ids && i.canteen_ids.includes(filters.canteen));
    }

    if (filters.jainOnly === 'true' || filters.jainOnly === true) {
      items = items.filter(i => i.is_jain === true);
    }

    if (filters.category && filters.category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.cuisine && filters.cuisine !== 'all') {
      items = items.filter(i => i.state_cuisine && i.state_cuisine.toLowerCase() === filters.cuisine.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.desc.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.state_cuisine && i.state_cuisine.toLowerCase().includes(q))
      );
    }

    if (filters.minPrice) {
      items = items.filter(i => i.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      items = items.filter(i => i.price <= Number(filters.maxPrice));
    }

    // Sorting
    if (filters.sort === 'price_asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price_desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (filters.sort === 'popular') {
      items.sort((a, b) => b.reviews_count - a.reviews_count);
    }

    return items;
  }

  getMenuItemById(id) {
    return this.data.menu.find(i => i.id === Number(id));
  }

  addMenuItem(item) {
    const newItem = {
      id: Date.now(),
      rating: 5.0,
      reviews_count: 1,
      custom_options: item.custom_options || [],
      ...item
    };
    this.data.menu.unshift(newItem);
    this.save();
    return newItem;
  }

  updateMenuItem(id, updates) {
    const idx = this.data.menu.findIndex(i => i.id === Number(id));
    if (idx !== -1) {
      this.data.menu[idx] = { ...this.data.menu[idx], ...updates };
      this.save();
      return this.data.menu[idx];
    }
    return null;
  }

  deleteMenuItem(id) {
    const idx = this.data.menu.findIndex(i => i.id === Number(id));
    if (idx !== -1) {
      const deleted = this.data.menu.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  quickToggleMenuItem(id, { field, value }) {
    const item = this.getMenuItemById(id);
    if (!item) return null;

    if (field === 'stock_status') {
      item.stock_status = value;
    } else if (field === 'floor') {
      const currentFloors = item.canteen_ids || ['ground', '6th_floor', '8th_floor'];
      if (currentFloors.includes(value)) {
        item.canteen_ids = currentFloors.filter(f => f !== value);
        if (item.canteen_ids.length === 0) item.canteen_ids = [value];
      } else {
        item.canteen_ids = [...currentFloors, value];
      }
    } else if (field === 'canteen_ids') {
      item.canteen_ids = Array.isArray(value) ? value : [value];
    } else {
      item[field] = value;
    }

    this.save();
    return item;
  }

  // --- Orders ---
  getOrders(filters = {}) {
    let list = [...this.data.orders];
    if (filters.userId) {
      list = list.filter(o => o.user_id === Number(filters.userId));
    }
    if (filters.canteen && filters.canteen !== 'all') {
      list = list.filter(o => o.canteen_id === filters.canteen);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(o => o.status.toLowerCase() === filters.status.toLowerCase());
    }
    // Sort most recent first
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }

  getOrderById(id) {
    if (!id) return null;
    const strId = String(id).trim().toLowerCase();
    return this.data.orders.find(o => 
      o.id === Number(id) || 
      (o.order_code && o.order_code.toLowerCase() === strId)
    );
  }

  createOrder(orderData) {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const estMins = 12; // 12 mins typical prep time
    const readyAt = new Date(Date.now() + estMins * 60 * 1000).toISOString();

    const newOrder = {
      id: Date.now(),
      order_code: `SVKM-${codeNum}`,
      status: "Placed", // Placed -> Preparing -> Ready -> Completed
      estimated_mins: estMins,
      estimated_ready_at: readyAt,
      created_at: new Date().toISOString(),
      ...orderData
    };

    this.data.orders.unshift(newOrder);

    // 1 SVKM Coin for every ₹20 spent (User requirement: 1 coin per 20)
    const orderTotal = Number(orderData.total) || 0;
    const coinsEarned = Math.floor(orderTotal / 20);
    const coinsRedeemed = Number(orderData.coins_redeemed) || 0;

    let loyaltyEarned = false;
    let newCoupon = null;
    let userCoins = 0;

    if (orderData.user_id) {
      const user = this.findUserById(orderData.user_id);
      if (user) {
        // Update user coins: deduct redeemed, add newly earned
        user.svkm_coins = Math.max(0, (user.svkm_coins || 0) - coinsRedeemed + coinsEarned);
        userCoins = user.svkm_coins;

        // Loyalty milestone check
        user.loyalty_count = (user.loyalty_count || 0) + 1;
        if (user.loyalty_count % 5 === 0) {
          loyaltyEarned = true;
          const couponCode = `SVKM-FREEBIE-${Math.floor(100 + Math.random() * 900)}`;
          newCoupon = {
            id: Date.now() + 1,
            code: couponCode,
            description: `🎉 5th Order Reward! Flat ₹80 OFF on your next order!`,
            discount_flat: 80,
            min_order: 100,
            is_active: true,
            redemption_count: 0
          };
          this.data.coupons.push(newCoupon);
        }
      }
    }

    // Increment coupon redemption count if a coupon was used
    if (orderData.coupon_code) {
      const coupon = this.data.coupons.find(c => c.code.toUpperCase() === orderData.coupon_code.trim().toUpperCase());
      if (coupon) {
        coupon.redemption_count = (coupon.redemption_count || 0) + 1;
      }
    }

    newOrder.coins_earned = coinsEarned;
    newOrder.coins_redeemed = coinsRedeemed;

    this.save();
    return { order: newOrder, loyaltyEarned, newCoupon, coinsEarned, userCoins };
  }

  updateOrderStatus(orderId, status) {
    const order = this.data.orders.find(o => o.id === Number(orderId) || o.order_code === orderId);
    if (order) {
      order.status = status;
      if (status === 'Completed' && !order.completed_at) {
        order.completed_at = new Date().toISOString();
      }
      this.save();
      return order;
    }
    return null;
  }

  addOrderReview(orderId, review) {
    const order = this.data.orders.find(o => o.id === Number(orderId) || o.order_code === orderId);
    if (order) {
      order.review = {
        rating: review.rating || 5,
        tags: review.tags || [],
        comment: review.comment || '',
        created_at: new Date().toISOString()
      };
      this.save();
      return order;
    }
    return null;
  }

  // --- SVKM Coins ---
  updateUserCoins(userId, delta) {
    const user = this.findUserById(userId);
    if (user) {
      user.svkm_coins = Math.max(0, (user.svkm_coins || 0) + delta);
      this.save();
      return user.svkm_coins;
    }
    return 0;
  }

  // --- Coupons ---
  getCoupons(includeAll = false) {
    if (!this.data.coupons) this.data.coupons = [];
    if (includeAll) return this.data.coupons;
    return this.data.coupons.filter(c => c.is_active);
  }

  updateCoupon(id, updates) {
    if (!this.data.coupons) this.data.coupons = [];
    const idx = this.data.coupons.findIndex(c => String(c.id) === String(id) || c.code === id);
    if (idx !== -1) {
      this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
      this.save();
      return this.data.coupons[idx];
    }
    return null;
  }

  addCoupon(coupon) {
    if (!this.data.coupons) this.data.coupons = [];
    const newCoupon = {
      id: Date.now(),
      is_active: true,
      redemption_count: 0,
      ...coupon,
      code: coupon.code.trim().toUpperCase()
    };
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }

  validateCoupon(code, subtotal, userId = null, clientTime = null) {
    if (!this.data.coupons) this.data.coupons = [];
    const coupon = this.data.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) return { valid: false, message: "Invalid promo code" };
    if (!coupon.is_active) return { valid: false, message: `Promo code '${coupon.code}' is currently paused by canteen administration` };

    // Minimum order check
    if (coupon.min_order && subtotal < coupon.min_order) {
      return { 
        valid: false, 
        message: `'${coupon.code}' requires a minimum order of ₹${coupon.min_order} (Current: ₹${subtotal})` 
      };
    }

    // Time-restricted Off-Peak check (e.g. HAPPYHOUR15)
    if (coupon.type === 'time_restricted' || (coupon.off_peak_windows && coupon.off_peak_windows.length > 0)) {
      // Determine current IST time (HH:mm)
      let timeToCheck = clientTime;
      if (!timeToCheck) {
        try {
          const now = new Date();
          const istParts = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).formatToParts(now);
          const h = istParts.find(p => p.type === 'hour')?.value || '12';
          const m = istParts.find(p => p.type === 'minute')?.value || '00';
          timeToCheck = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        } catch (e) {
          const now = new Date();
          timeToCheck = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
      }

      const windows = coupon.off_peak_windows || [
        { start: "09:00", end: "11:30" },
        { start: "15:00", end: "17:00" }
      ];

      const inWindow = windows.some(w => timeToCheck >= w.start && timeToCheck <= w.end);
      if (!inWindow) {
        const windowDesc = windows.map(w => `${formatTime12(w.start)} - ${formatTime12(w.end)}`).join(' & ');
        return {
          valid: false,
          message: `'${coupon.code}' is only active during off-peak hours (${windowDesc}). Cafeteria is currently in Peak Lunch Rush!`
        };
      }
    }

    // First-time order check (e.g. FIRSTBITE)
    if (coupon.type === 'first_order' || coupon.code === 'FIRSTBITE') {
      if (userId) {
        const userOrders = this.data.orders.filter(o => o.user_id === Number(userId));
        if (userOrders.length > 0) {
          return {
            valid: false,
            message: `'${coupon.code}' is exclusively reserved for your first SVKM Canteen order!`
          };
        }
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_percent) {
      discount = (subtotal * coupon.discount_percent) / 100;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    } else if (coupon.discount_flat) {
      discount = coupon.discount_flat;
    }

    return { 
      valid: true, 
      coupon, 
      discount: Math.min(discount, subtotal),
      savings_message: `Saved ₹${Math.min(discount, subtotal)} with ${coupon.code}!`
    };
  }
}

function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const store = new Store();
module.exports = store;
