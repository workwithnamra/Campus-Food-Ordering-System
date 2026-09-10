import API_BASE from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  AlertCircle,
  Coins,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RazorpayModal from '../components/RazorpayModal';

export default function CartPage({ selectedCanteen, setSelectedCanteen }) {
  const { 
    cart, 
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
  } = useCart();
  const { user, incrementLoyalty, userCoins, awardCoins, spendCoins } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTiming, setOrderTiming] = useState('now');
  const [selectedBreakSlot, setSelectedBreakSlot] = useState('10:15 AM');
  const [fulfillmentType, setFulfillmentType] = useState('delivery'); // for faculty: 'delivery' or 'pickup'
  const [facultyDept, setFacultyDept] = useState('Computer Engineering Dept');
  const [facultyCabin, setFacultyCabin] = useState('Cabin 604 (6th Floor)');
  const [facultyPhone, setFacultyPhone] = useState('Ext: 4210');

  useEffect(() => {
    fetch(`${API_BASE}/api/coupons`)
      .then(res => res.json())
      .then(data => setAvailableCoupons(data))
      .catch(err => console.error('Failed to load coupons:', err));
  }, []);

  const handleApplyCoupon = async (codeToApply) => {
    setCouponError('');
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          subtotal, 
          userId: user?.id 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to apply coupon';
        setCouponError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }
      setAppliedCoupon(data.coupon);
      setCouponCode('');
      setCouponError('');
      showToast(`'${data.coupon.code}' applied! You saved ₹${data.discount}`, 'promo');
    } catch (err) {
      setCouponError('Network error applying coupon');
      showToast('Network error applying coupon', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    showToast('Coupon removed', 'info');
  };

  const handleToggleCoins = (checked) => {
    setRedeemCoins(checked);
    if (checked) {
      showToast(`Redeemed ${coinsRedeemedCount || Math.min(userCoins, subtotal)} SVKM Coins!`, 'success');
    } else {
      showToast('Coins redemption disabled', 'info');
    }
  };

  const getCanteenName = (id) => {
    if (id === 'ground') return 'Ground Floor - Main Campus Plaza';
    if (id === '6th_floor') return '6th Floor - Faculty & Student Hub';
    if (id === '8th_floor') return '8th Floor - Sky Gourmet Lounge';
    return 'Ground Floor - Main Campus Plaza';
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        user_id: user?.id || 2,
        user_name: user?.name || 'Aarav Shah',
        user_email: user?.email || 'student@svkm.edu',
        canteen_id: selectedCanteen === 'all' ? 'ground' : selectedCanteen,
        canteen_name: getCanteenName(selectedCanteen === 'all' ? 'ground' : selectedCanteen),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          unit_price: item.unitPrice,
          selected_customizations: item.selectedCustomizations || []
        })),
        subtotal,
        discount,
        coupon_discount: couponDiscount,
        coin_discount: coinDiscount,
        coupon_code: appliedCoupon?.code || null,
        coins_redeemed: coinsRedeemedCount,
        total: grandTotal,
        payment_method: paymentDetails.payment_method || 'Razorpay UPI',
        order_timing: orderTiming,
        scheduled_for: orderTiming === 'break' ? selectedBreakSlot : 'Immediate',
        fulfillment_type: user?.role === 'teacher' ? fulfillmentType : 'pickup',
        delivery_location: user?.role === 'teacher' && fulfillmentType === 'delivery' 
          ? `${facultyCabin}, ${facultyDept} (${facultyPhone})` 
          : 'Self-Pickup at Counter'
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      incrementLoyalty();
      if (coinsRedeemedCount > 0) spendCoins(coinsRedeemedCount);
      if (data.coinsEarned) awardCoins(data.coinsEarned);
      showToast(`🎉 Order Placed! You earned +${data.coinsEarned || coinsToEarn} SVKM Coins!`, 'success', 5000);
      clearCart();
      setShowPaymentModal(false);
      navigate(`/orders?newOrder=${data.order.order_code}`);
    } catch (err) {
      showToast('Error placing order: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black font-heading text-gray-900 mb-2">
          Your Cart is Empty
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Explore delicious Pav Bhaji, Gujarati snacks, Asian wok dishes, and shakes!
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-violet-200 transition"
        >
          <span>Browse College Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black font-heading text-gray-900">
            Checkout & Cart
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Review your dishes and select your pickup counter.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Canteen Pickup Floor Confirmation */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider">
                  Pickup Destination Floor
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {getCanteenName(selectedCanteen === 'all' ? 'ground' : selectedCanteen)}
                </p>
              </div>
            </div>
            
            <select
              value={selectedCanteen === 'all' ? 'ground' : selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="bg-white border border-amber-300 text-xs font-bold rounded-xl px-3 py-2 text-gray-800 focus:outline-none"
            >
              <option value="ground">Ground Floor - Main Plaza</option>
              <option value="6th_floor">6th Floor - Faculty Hub</option>
              <option value="8th_floor">8th Floor - Sky Lounge</option>
            </select>
          </div>

          {/* Smart "Class-Break" Pre-Order Scheduler (Campus Specific Feature) */}
          <div className="bg-violet-50/70 border border-violet-200 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">⏰</span>
                <div>
                  <span className="text-xs font-black text-violet-950 block">
                    Smart "Class-Break" Pre-Order (Zero Line Wait!)
                  </span>
                  <span className="text-[11px] text-violet-700 font-medium">
                    Schedule food to be piping hot & ready right when lecture ends
                  </span>
                </div>
              </div>

              <div className="flex bg-white rounded-xl p-0.5 border border-violet-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOrderTiming('now')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderTiming === 'now' 
                      ? 'bg-violet-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚡ ASAP
                </button>
                <button
                  type="button"
                  onClick={() => setOrderTiming('break')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderTiming === 'break' 
                      ? 'bg-violet-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⏰ Class Break
                </button>
              </div>
            </div>

            {orderTiming === 'break' && (
              <div className="pt-2 border-t border-violet-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn">
                <span className="text-xs font-bold text-violet-900">
                  Select Lecture Recess Time:
                </span>
                <select
                  value={selectedBreakSlot}
                  onChange={(e) => setSelectedBreakSlot(e.target.value)}
                  className="bg-white border border-violet-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="10:15 AM">10:15 AM - Morning Recess (15 mins)</option>
                  <option value="11:45 AM">11:45 AM - Mid-Day Lecture Break (10 mins)</option>
                  <option value="01:15 PM">01:15 PM - College Lunch Hour (45 mins)</option>
                  <option value="03:30 PM">03:30 PM - Afternoon Chai & Snack Break</option>
                </select>
              </div>
            )}
          </div>

          {/* Fulfillment Mode: Student Self-Pickup vs Faculty Desk Delivery */}
          {user?.role === 'teacher' ? (
            /* FACULTY VIEW: Choice between Desk Delivery or Counter Pickup */
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">👨‍🏫</span>
                  <div>
                    <span className="text-xs font-black text-amber-950 block">
                      Faculty Delivery Perks Unlocked
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      Orders can be delivered directly to your Staff Room or Cabin!
                    </span>
                  </div>
                </div>

                <div className="flex bg-white rounded-xl p-1 border border-amber-300 text-xs font-bold shadow-sm">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      fulfillmentType === 'delivery'
                        ? 'bg-amber-500 text-gray-950 shadow-sm font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🚀 Cabin Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      fulfillmentType === 'pickup'
                        ? 'bg-amber-500 text-gray-950 shadow-sm font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🚶 Self-Pickup
                  </button>
                </div>
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-fadeIn">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={facultyDept}
                      onChange={(e) => setFacultyDept(e.target.value)}
                      placeholder="e.g. Computer Dept"
                      className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                      Cabin / Room No.
                    </label>
                    <input
                      type="text"
                      value={facultyCabin}
                      onChange={(e) => setFacultyCabin(e.target.value)}
                      placeholder="e.g. Cabin 604"
                      className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                      Intercom / Mobile
                    </label>
                    <input
                      type="text"
                      value={facultyPhone}
                      onChange={(e) => setFacultyPhone(e.target.value)}
                      placeholder="Ext 4210"
                      className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STUDENT VIEW: Self-Pickup at Counter */
            <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md shadow-blue-200">
                  🚶‍♂️
                </div>
                <div>
                  <span className="text-xs font-black text-blue-950 block">
                    Student Self-Pickup Mode
                  </span>
                  <p className="text-[11px] text-blue-700 font-medium leading-tight">
                    Collect your order directly from the Canteen Counter #{selectedCanteen === 'ground' ? '1' : selectedCanteen === '6th_floor' ? '2' : '3'} using your digital token & OTP.
                  </p>
                </div>
              </div>

              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                Self Pickup
              </span>
            </div>
          )}

          {/* Items List */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.cartKey} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="flex items-center space-x-4">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-heading font-bold text-base text-gray-900">
                        {item.name}
                      </h4>
                      {item.is_jain && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                          JAIN
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs font-bold text-gray-400 block mt-0.5">
                      Base: ₹{item.price}
                    </span>

                    {/* Selected Customizations list (extra pav, etc.) */}
                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedCustomizations.map((c, idx) => (
                          <span key={idx} className="text-[10px] bg-violet-50 text-violet-800 font-bold px-2 py-0.5 rounded-full border border-violet-100">
                            +{c.name} (₹{c.price})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Item Total */}
                <div className="flex items-center justify-between w-full sm:w-auto space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-2xl p-1">
                    <button
                      onClick={() => updateQuantity(item.cartKey, -1)}
                      className="w-7 h-7 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 shadow-sm transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-gray-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartKey, 1)}
                      className="w-7 h-7 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-heading font-black text-lg text-gray-900 block">
                      ₹{item.unitPrice * item.qty}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartKey)}
                    className="text-gray-300 hover:text-rose-600 p-1.5 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Right 1 Col: Summary & Razorpay / UPI */}
        <div className="space-y-6">
          
          {/* Promo Codes & Coupons Box */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-heading font-bold text-gray-900 text-sm mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <Tag className="w-4 h-4 text-violet-600 mr-2" />
                <span>Apply Campus Promo Code</span>
              </div>
              {appliedCoupon && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  1 APPLIED
                </span>
              )}
            </h3>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    %
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-900 block tracking-wider">
                      {appliedCoupon.code} APPLIED!
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      You saved ₹{couponDiscount} on this meal
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="p-1.5 rounded-xl hover:bg-emerald-100 text-emerald-800 transition"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. GROUP50)"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    className="flex-1 text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600 font-bold uppercase"
                  />
                  <button
                    onClick={() => handleApplyCoupon()}
                    className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-95 shadow-sm"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <div className="flex items-start space-x-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-semibold animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-600" />
                    <span>{couponError}</span>
                  </div>
                )}

                {/* Quick 1-click coupon suggestions */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Campus Student Offers
                    </span>
                    <span className="text-[10px] text-violet-600 font-bold">1-Tap Apply</span>
                  </div>

                  {availableCoupons.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleApplyCoupon(c.code)}
                      className="w-full text-left p-2.5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 hover:bg-violet-100/60 hover:border-violet-300 transition flex items-center justify-between group"
                    >
                      <div className="pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-violet-900 group-hover:text-violet-700 font-mono">
                            {c.code}
                          </span>
                          {c.type === 'time_restricted' && (
                            <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 rounded">
                              Off-Peak
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-600 block mt-0.5 leading-snug">
                          {c.description}
                        </span>
                      </div>
                      <span className="text-[10px] bg-white group-hover:bg-violet-600 group-hover:text-white text-violet-700 font-extrabold px-2.5 py-1 rounded-xl border border-violet-200 transition shadow-xs flex-shrink-0">
                        Apply
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SVKM Coins Loyalty Redemption Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-sm shadow-sm">
                  🪙
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950">
                    SVKM Coins Balance
                  </h4>
                  <p className="text-[11px] text-amber-800 font-medium">
                    You have <strong className="text-amber-950 font-black">{userCoins} Coins</strong> (Worth ₹{userCoins})
                  </p>
                </div>
              </div>

              {userCoins > 0 && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redeemCoins}
                    onChange={(e) => handleToggleCoins(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              )}
            </div>

            {userCoins > 0 ? (
              <div className="text-[11px] text-amber-900/90 bg-white/70 border border-amber-200/60 p-2.5 rounded-2xl flex items-center justify-between">
                <span>
                  {redeemCoins ? (
                    <span className="font-bold text-emerald-800">
                      ✅ Redeeming {coinsRedeemedCount} coins (-₹{coinDiscount})
                    </span>
                  ) : (
                    <span>Toggle switch to redeem coins on this order (10 Coins = ₹10)</span>
                  )}
                </span>
                {redeemCoins && (
                  <span className="font-mono font-black text-emerald-700 text-xs">
                    -₹{coinDiscount}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-amber-800/80 bg-white/50 p-2 rounded-xl">
                Earn 1 SVKM Coin for every ₹20 spent on cafeteria orders!
              </p>
            )}
          </div>

          {/* Bill Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-gray-900 text-base">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal ({totalItemCount} items)</span>
                <span>₹{subtotal}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon ({appliedCoupon?.code})</span>
                  </span>
                  <span>- ₹{couponDiscount}</span>
                </div>
              )}

              {coinDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span className="flex items-center space-x-1">
                    <span>🪙</span>
                    <span>SVKM Coins ({coinsRedeemedCount} coins)</span>
                  </span>
                  <span>- ₹{coinDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 font-medium">
                <span>Student Campus Surcharge</span>
                <span className="text-emerald-600 font-bold">FREE (₹0)</span>
              </div>

              {/* Coin Earning Note */}
              <div className="bg-violet-50/80 border border-violet-100 p-2 rounded-xl flex items-center justify-between text-[11px] text-violet-900 font-medium">
                <span className="flex items-center space-x-1">
                  <span>✨</span>
                  <span>Coins earned on this meal:</span>
                </span>
                <strong className="font-black text-violet-700">+{coinsToEarn} SVKM Coins</strong>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <div>
                  <span className="font-heading font-black text-gray-900 text-base block">
                    Grand Total
                  </span>
                  <span className="text-[10px] text-gray-400">Inclusive of all taxes &amp; charges</span>
                </div>
                <span className="font-heading font-black text-2xl text-violet-700">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {/* Proceed to Payment with Razorpay Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-heading font-black text-sm shadow-xl shadow-violet-200 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Pay with Razorpay / UPI (₹{grandTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400 font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Token Generation Upon Payment</span>
            </div>
          </div>

        </div>

      </div>

      {/* Razorpay Checkout Modal */}
      <RazorpayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={grandTotal}
        orderDetails={{
          canteen_name: getCanteenName(selectedCanteen === 'all' ? 'ground' : selectedCanteen)
        }}
        onSuccess={handlePaymentSuccess}
      />

    </div>
  );
}
