require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const store = require('./db/store');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/images', express.static(path.join(__dirname, '../../frontend/public/images')));

// Initialize Razorpay with test keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});



// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    totalItems: store.data.menu.length,
    activeOrders: store.data.orders.length
  });
});

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const user = store.findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Omit password
  const { password: _, ...userData } = user;
  res.json({
    token: `svkm-token-${user.id}-${Date.now()}`,
    user: userData
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, food_pref, canteen } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }

  const existing = store.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser = store.createUser({
    name,
    email,
    password,
    role: role || 'student', // student, teacher, admin
    food_pref: food_pref || 'normal', // jain, normal
    canteen: canteen || 'ground' // ground, 6th_floor, 8th_floor
  });

  const { password: _, ...userData } = newUser;
  res.status(201).json({
    token: `svkm-token-${newUser.id}-${Date.now()}`,
    user: userData
  });
});

app.put('/api/auth/profile', (req, res) => {
  const { id, food_pref, canteen, name } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID required' });
  
  const updated = store.updateUser(id, { food_pref, canteen, name });
  if (!updated) return res.status(404).json({ error: 'User not found' });

  const { password: _, ...userData } = updated;
  res.json({ user: userData });
});

// --- MENU & FILTERING ---
app.get('/api/menu', (req, res) => {
  const { canteen, jainOnly, category, cuisine, search, minPrice, maxPrice, sort } = req.query;
  const items = store.getMenuItems({
    canteen,
    jainOnly,
    category,
    cuisine,
    search,
    minPrice,
    maxPrice,
    sort
  });
  res.json({
    total: items.length,
    items
  });
});

app.get('/api/menu/:id', (req, res) => {
  const item = store.getMenuItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// --- COUPONS & LOYALTY ---
app.get('/api/coupons', (req, res) => {
  res.json(store.getCoupons());
});

app.post('/api/coupons/apply', (req, res) => {
  const { code, subtotal, userId, clientTime } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });

  const result = store.validateCoupon(code, subtotal || 0, userId, clientTime);
  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// --- ORDERS ---
app.get('/api/orders', (req, res) => {
  const { userId, canteen, status } = req.query;
  const orders = store.getOrders({ userId, canteen, status });
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = store.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// --- LIVE QUEUE RADAR ---
app.get('/api/queue-radar', (req, res) => {
  const orders = store.data.orders || [];
  const activeOrders = orders.filter(o => ['Placed', 'Preparing'].includes(o.status));

  const getCanteenInfo = (id, defaultName, defaultBadge) => {
    const queueOrders = activeOrders.filter(o => o.canteen_id === id);
    const count = queueOrders.length;
    const prepWaitMins = Math.max(3, Math.round(count * 1.5 + 4));

    let status = 'smooth';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let dotColor = 'bg-emerald-500';
    let badge = defaultBadge;

    if (count > 8) {
      status = 'busy';
      badge = 'Peak Rush 🔥';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      dotColor = 'bg-rose-500';
    } else if (count > 3) {
      status = 'moderate';
      badge = 'Moderate Flow ⏳';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      dotColor = 'bg-amber-500';
    }

    return {
      id,
      name: defaultName,
      ordersAhead: count,
      prepWaitMins,
      status,
      statusColor,
      dotColor,
      badge
    };
  };

  const radar = [
    getCanteenInfo('ground', 'Ground Floor Plaza', 'Fast Moving ⚡'),
    getCanteenInfo('6th_floor', '6th Floor Jain & Faculty', 'Pure Jain 🌿'),
    getCanteenInfo('8th_floor', '8th Floor Sky Lounge', 'Asian & Desserts ✨')
  ];

  res.json({ radar, timestamp: new Date().toISOString() });
});

app.post('/api/orders', (req, res) => {
  const { 
    user_id, 
    user_name, 
    user_email, 
    user_role,
    canteen_id, 
    canteen_name, 
    items, 
    subtotal, 
    discount, 
    total, 
    payment_method,
    order_timing,
    scheduled_for,
    fulfillment_type,
    delivery_location,
    pickup_counter,
    pickup_otp,
    coupon_code,
    coins_redeemed,
    coin_discount
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cannot place empty order' });
  }

  const result = store.createOrder({
    user_id,
    user_name: user_name || 'Guest Student',
    user_email: user_email || 'guest@svkm.edu',
    user_role: user_role || 'student',
    canteen_id: canteen_id || 'ground',
    canteen_name: canteen_name || 'Ground Floor Canteen',
    items,
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    total: Number(total) || 0,
    payment_method: payment_method || 'Razorpay UPI',
    payment_status: 'PAID',
    order_timing: orderTimingSafe(order_timing),
    scheduled_for: scheduled_for || 'Immediate',
    fulfillment_type: fulfillment_type || 'pickup',
    delivery_location: delivery_location || 'Self-Pickup at Counter',
    pickup_counter: pickup_counter || 'Counter 1',
    pickup_otp: pickup_otp || Math.floor(1000 + Math.random() * 9000).toString(),
    coupon_code: coupon_code || null,
    coins_redeemed: Number(coins_redeemed) || 0,
    coin_discount: Number(coin_discount) || 0
  });

  res.status(201).json(result);
});

function orderTimingSafe(timing) {
  return timing === 'break' ? 'break' : 'now';
}

app.post('/api/orders/:id/review', (req, res) => {
  const { rating, tags, comment } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }
  const updated = store.addOrderReview(req.params.id, { rating, tags, comment });
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json({ message: 'Review submitted successfully', order: updated });
});

// --- ADMIN ENDPOINTS ---
app.put('/api/admin/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
  }

  const updated = store.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

app.post('/api/admin/menu', (req, res) => {
  const item = req.body;
  if (!item.name || item.price === undefined || !item.category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }
  const created = store.addMenuItem({
    ...item,
    price: Number(item.price),
    prep_time: Number(item.prep_time) || 10,
    stock_status: item.stock_status || 'in_stock',
    canteen_ids: Array.isArray(item.canteen_ids) && item.canteen_ids.length ? item.canteen_ids : ['ground', '6th_floor', '8th_floor'],
    dietary_badges: item.dietary_badges || [],
    is_jain: Boolean(item.is_jain || (item.dietary_badges && item.dietary_badges.includes('Jain Available')))
  });
  res.status(201).json(created);
});

app.put('/api/admin/menu/:id', (req, res) => {
  const item = req.body;
  const updates = {
    ...item
  };
  if (item.price !== undefined) updates.price = Number(item.price);
  if (item.prep_time !== undefined) updates.prep_time = Number(item.prep_time);
  if (item.dietary_badges !== undefined) {
    updates.dietary_badges = item.dietary_badges;
    updates.is_jain = item.is_jain !== undefined ? Boolean(item.is_jain) : item.dietary_badges.includes('Jain Available');
  }

  const updated = store.updateMenuItem(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Item not found' });
  res.json(updated);
});

app.patch('/api/admin/menu/:id/quick-toggle', (req, res) => {
  const { field, value } = req.body;
  if (!field) {
    return res.status(400).json({ error: 'Field is required for quick-toggle' });
  }
  const updated = store.quickToggleMenuItem(req.params.id, { field, value });
  if (!updated) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Item updated successfully', item: updated });
});

app.delete('/api/admin/menu/:id', (req, res) => {
  const deleted = store.deleteMenuItem(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Item deleted successfully', item: deleted });
});

app.get('/api/admin/stats', (req, res) => {
  const orders = store.data.orders;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const canteenCounts = {
    ground: orders.filter(o => o.canteen_id === 'ground').length,
    '6th_floor': orders.filter(o => o.canteen_id === '6th_floor').length,
    '8th_floor': orders.filter(o => o.canteen_id === '8th_floor').length,
  };
  const activeOrders = orders.filter(o => ['Placed', 'Preparing', 'Ready'].includes(o.status)).length;

  res.json({
    totalOrders: orders.length,
    activeOrders,
    totalRevenue,
    totalMenuItems: store.data.menu.length,
    canteenCounts,
    recentOrders: orders.slice(0, 5)
  });
});

// --- ADMIN COUPON ENDPOINTS ---
app.get('/api/admin/coupons', (req, res) => {
  res.json(store.getCoupons(true)); // returns all coupons including inactive
});

app.put('/api/admin/coupons/:id', (req, res) => {
  const updated = store.updateCoupon(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ message: 'Coupon updated successfully', coupon: updated });
});

app.post('/api/admin/coupons', (req, res) => {
  const { code, description, discount_percent, discount_flat, min_order, off_peak_windows, type } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });
  const newCoupon = store.addCoupon({
    code,
    description: description || `Campus promo ${code}`,
    discount_percent: discount_percent ? Number(discount_percent) : undefined,
    discount_flat: discount_flat ? Number(discount_flat) : undefined,
    min_order: Number(min_order) || 0,
    off_peak_windows: off_peak_windows || [],
    type: type || 'regular'
  });
  res.status(201).json(newCoupon);
});

// --- USER COINS ENDPOINT ---
app.get('/api/users/:id/coins', (req, res) => {
  const user = store.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ coins: user.svkm_coins || 0, user_id: user.id });
});


// --- RAZORPAY PAYMENT GATEWAY ---

// Step 1: Create a Razorpay order (called before showing checkout popup)
app.post('/api/payments/create-order', async (req, res) => {
  const { amount } = req.body; // amount in paise (INR * 100)
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount (in paise) is required' });
  }

  try {
    const options = {
      amount: Math.round(amount), // paise, must be integer
      currency: 'INR',
      receipt: `svkm_rcpt_${Date.now()}`,
      notes: {
        canteen: 'SVKM College Canteen',
        environment: 'test'
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order', details: err.message });
  }
});

// Step 2: Verify payment signature after checkout popup closes
app.post('/api/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    res.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      message: 'Payment verified successfully'
    });
  } else {
    res.status(400).json({ success: false, error: 'Payment signature mismatch — possible fraud attempt' });
  }
});

// Step 3: Get Razorpay public key (safe to expose)
app.get('/api/payments/key', (req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 SVKM Crazy Canteen Backend is LIVE on port ${PORT}`);
  console.log(`🚀 Total Menu Items: ${store.data.menu.length}`);
  console.log(`💳 Razorpay Gateway: ${process.env.RAZORPAY_KEY_ID ? '✅ ACTIVE (' + process.env.RAZORPAY_KEY_ID + ')' : '❌ NOT CONFIGURED'}`);
});
