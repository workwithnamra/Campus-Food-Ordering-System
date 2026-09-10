import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Clock, 
  ChefHat, 
  BellRing, 
  CheckCircle2, 
  MapPin, 
  RefreshCw, 
  ShoppingBag, 
  Star, 
  MessageSquare,
  ArrowRight,
  Timer,
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderReviewModal from '../components/OrderReviewModal';

export default function OrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [reviewOrder, setReviewOrder] = useState(null);
  const [searchTokenInput, setSearchTokenInput] = useState('');
  const [lastSynced, setLastSynced] = useState(null);
  const prevStatusesRef = useRef({});

  const queryParams = new URLSearchParams(location.search);
  const newOrderCode = queryParams.get('newOrder');

  // Gentle audio chime when order becomes 'Ready'
  const playReadySound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/orders?userId=${user?.id || 2}`);
      const data = await res.json();
      let orderList = Array.isArray(data) ? data : [];

      // If a newOrderCode is specified in URL and not in user list, fetch it specifically
      if (newOrderCode && !orderList.some(o => o.order_code === newOrderCode)) {
        try {
          const sRes = await fetch(`http://localhost:5000/api/orders/${newOrderCode}`);
          if (sRes.ok) {
            const sOrder = await sRes.json();
            if (sOrder && sOrder.id) orderList = [sOrder, ...orderList];
          }
        } catch (e) {}
      }

      // Check for 'Ready' status transitions
      orderList.forEach(o => {
        const prev = prevStatusesRef.current[o.id];
        if (prev && prev !== 'Ready' && o.status === 'Ready') {
          playReadySound();
          showToast(`🔔 Token ${o.order_code} is READY at ${o.canteen_name}!`, 'success', 6000);
        }
        prevStatusesRef.current[o.id] = o.status;
      });

      setOrders(orderList);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // High-frequency live polling: 2.5s for real-time order tracking
  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 2500);
    return () => clearInterval(interval);
  }, [user, newOrderCode]);

  // Instant Token Search Handler
  const handleTokenSearch = async (e) => {
    e.preventDefault();
    const tokenToSearch = searchTokenInput.trim().toUpperCase();
    if (!tokenToSearch) {
      showToast('Please enter a token code (e.g. SVKM-9966)', 'info');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${tokenToSearch}`);
      if (!res.ok) {
        showToast(`Token "${tokenToSearch}" not found in system`, 'error');
        return;
      }
      const foundOrder = await res.json();
      if (foundOrder && foundOrder.id) {
        setOrders(prev => {
          const filtered = prev.filter(o => o.id !== foundOrder.id);
          return [foundOrder, ...filtered];
        });
        setActiveTab(foundOrder.status === 'Completed' || foundOrder.status === 'Cancelled' ? 'history' : 'active');
        showToast(`Found Token ${foundOrder.order_code} (${foundOrder.status})! 🎯`, 'success');
      }
    } catch (err) {
      showToast('Error searching token: ' + err.message, 'error');
    }
  };

  const activeOrders = orders.filter(o => {
    if (['Placed', 'Preparing', 'Ready'].includes(o.status)) return true;
    // Keep "Completed" in active tab (within last 120 seconds) so student sees it was collected
    if (o.status === 'Completed' && o.completed_at) {
      const completedMsAgo = Date.now() - new Date(o.completed_at).getTime();
      return completedMsAgo < 120_000;
    }
    return false;
  });
  const completedOrders = orders.filter(o => ['Completed', 'Cancelled'].includes(o.status));

  const getStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'placed') return 1;
    if (s === 'preparing') return 2;
    if (s === 'ready') return 3;
    if (s === 'completed') return 4;
    return 1;
  };

  const confirmCollected = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });
      if (res.ok) {
        showToast("Order marked as Collected! Hope you enjoy your meal! 🍽️", "success");
      }
      fetchOrders(true);
    } catch (err) {
      console.error('Failed to confirm collection:', err);
      showToast("Error updating collection status", "error");
    }
  };

  const calculateETA = (order) => {
    if (order.status === 'Ready') return "Ready for Pickup Now! 🔔";
    if (order.status === 'Completed') return "Delivered & Completed ✔️";

    const created = new Date(order.created_at).getTime();
    const estTotalMins = order.estimated_mins || 12;
    const readyTime = created + estTotalMins * 60 * 1000;
    const now = Date.now();
    const diffMins = Math.max(1, Math.round((readyTime - now) / (60 * 1000)));

    const readyFormatted = new Date(readyTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `~${diffMins} mins (Expected: ${readyFormatted})`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight">
            Order Status & Live Tracking
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Real-time cafeteria kitchen queue connected to kitchen display system
          </p>
        </div>

        <button
          onClick={() => { fetchOrders(false); showToast('Refreshed orders status ⚡', 'info'); }}
          className="p-2.5 text-gray-500 hover:text-violet-600 rounded-2xl hover:bg-gray-100 transition self-start sm:self-auto flex items-center space-x-1.5 border border-gray-200"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-600' : ''}`} />
          <span className="text-xs font-bold sm:hidden">Refresh</span>
        </button>
      </div>

      {/* Live Sync Banner + Token Search Card */}
      <div className="bg-gradient-to-r from-gray-950 via-violet-950 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-violet-800/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black tracking-wide text-emerald-300 uppercase">
              Kitchen Radar Connected
            </span>
            <span className="text-[10px] text-violet-300 font-mono">
              (Live Sync 2.5s)
            </span>
          </div>
          {lastSynced && (
            <span className="text-[11px] text-violet-200 font-mono">
              Last updated: {lastSynced}
            </span>
          )}
        </div>

        {/* Quick Token Search Bar */}
        <form onSubmit={handleTokenSearch} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-violet-300 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Track any token (e.g. SVKM-9966, SVKM-8834)..."
              value={searchTokenInput}
              onChange={(e) => setSearchTokenInput(e.target.value.toUpperCase())}
              className="w-full bg-white/10 text-white placeholder-violet-200/50 border border-white/20 rounded-2xl pl-10 pr-8 py-2.5 text-xs font-bold focus:outline-none focus:bg-white/20 focus:border-violet-400 transition uppercase tracking-wider"
            />
            {searchTokenInput && (
              <button
                type="button"
                onClick={() => setSearchTokenInput('')}
                className="absolute right-3 top-2.5 text-violet-300 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950 font-black text-xs px-5 py-2.5 rounded-2xl transition shadow-md flex-shrink-0 flex items-center space-x-1.5"
          >
            <span>Track Token</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'active'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span>Active Orders</span>
          <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
            {activeOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span>Past Orders & Reviews</span>
          <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
            {completedOrders.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Active Orders */}
      {activeTab === 'active' ? (
        activeOrders.length > 0 ? (
          <div className="space-y-6">
            {activeOrders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const isNewlyCreated = order.order_code === newOrderCode;

              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-sm space-y-5 transition-all ${
                    isNewlyCreated 
                      ? 'border-violet-500 ring-2 ring-violet-200 shadow-md' 
                      : 'border-gray-100'
                  }`}
                >
                  
                  {/* Top: Token, Floor & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-gray-900 font-heading">
                          Token: {order.order_code}
                        </span>
                        <OrderStatusBadge status={order.status} fulfillmentType={order.fulfillment_type} />
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-violet-600" />
                        <span className="font-semibold">{order.canteen_name}</span>
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Student Self-Pickup vs Faculty Delivery Badge */}
                      <div className="mt-2">
                        {order.fulfillment_type === 'delivery' ? (
                          <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-black">
                            <span>🚀 Faculty Priority Delivery:</span>
                            <span className="font-bold text-amber-800">{order.delivery_location}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-xl text-[11px] font-bold">
                            <span>🚶 Student Counter Self-Pickup</span>
                            <span className="text-blue-600">({order.pickup_counter || 'Counter 1'})</span>
                          </span>
                        )}
                        {order.scheduled_for && order.scheduled_for !== 'Immediate' && (
                          <span className="ml-2 inline-flex items-center space-x-1 bg-violet-100 text-violet-800 px-2 py-0.5 rounded-lg text-[10px] font-black">
                            <span>⏰ Scheduled: {order.scheduled_for}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ETA Countdown Badge */}
                    <div className="bg-violet-50 border border-violet-100 px-3.5 py-2 rounded-2xl flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-violet-600 animate-pulse" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">Estimated Wait</span>
                        <span className="text-xs font-black text-violet-900">{calculateETA(order)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Step Stepper */}
                  <div className="py-2">
                    <div className="grid grid-cols-4 relative">
                      <div className="absolute top-4 left-6 right-6 h-1 bg-gray-100 -z-0">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-500"
                          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                        />
                      </div>

                      {[
                        { step: 1, label: "Placed", icon: Clock },
                        { step: 2, label: "Cooking", icon: ChefHat },
                        { 
                          step: 3, 
                          label: order.fulfillment_type === 'delivery' ? "Out for Delivery" : "Ready at Counter", 
                          icon: BellRing 
                        },
                        { 
                          step: 4, 
                          label: order.fulfillment_type === 'delivery' ? "Delivered" : "Collected", 
                          icon: CheckCircle2 
                        },
                      ].map(({ step, label, icon: Icon }) => (
                        <div key={step} className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                            currentStep >= step ? 'bg-violet-600 text-white shadow' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-800 mt-1.5">{label}</span>
                        </div>
                      ))}
                    </div>

                    {order.status === 'Completed' && (
                      <div className="mt-5 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-400 flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-emerald-200 uppercase tracking-widest">
                            {order.fulfillment_type === 'delivery' ? '🚀 Delivered to your cabin!' : '✅ Order Collected!'}
                          </p>
                          <p className="text-xl font-black text-white mt-0.5">
                            {order.fulfillment_type === 'delivery' ? 'Enjoy your meal, enjoy the day!' : 'Hope you enjoy your meal!'}
                          </p>
                          <p className="text-[11px] text-emerald-300 mt-1">
                            Token <strong className="text-white font-mono">{order.order_code}</strong> • Moving to history shortly...
                          </p>
                        </div>
                      </div>
                    )}

                    {order.status === 'Ready' && (
                      <div className="mt-5 bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 text-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-400 animate-scaleUp">
                        {order.fulfillment_type === 'delivery' ? (
                          /* FACULTY DESK DELIVERY */
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                            <div className="space-y-2 text-center sm:text-left">
                              <div className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                                <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                                <span>OUT FOR CABIN DELIVERY</span>
                              </div>

                              <div>
                                <span className="text-gray-400 text-xs block font-bold">Faculty Cabin Delivery</span>
                                <span className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
                                  {order.order_code}
                                </span>
                              </div>

                              <div className="bg-white/10 border border-white/20 p-3 rounded-2xl text-xs space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-300 block">Delivering To:</span>
                                <span className="font-bold text-white block text-sm">📍 {order.delivery_location}</span>
                                <p className="text-[11px] text-gray-300">
                                  Cafeteria runner is bringing your meal tray to your cabin. Verification OTP: <strong className="text-amber-300 font-mono text-sm">{order.pickup_otp || (order.order_code ? order.order_code.replace('SVKM-', '') : '8421')}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="bg-white p-2.5 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=FACULTY_DELIVERY_${order.order_code}_${order.delivery_location}`}
                                alt="Faculty Delivery QR"
                                className="w-28 h-28 object-contain"
                              />
                              <span className="text-[9px] font-black text-gray-950 uppercase tracking-wider mt-1 block">
                                Runner QR Check
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* STUDENT COUNTER PICKUP */
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                            <div className="space-y-2 text-center sm:text-left">
                              <div className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                                <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                                <span>READY AT COUNTER FOR PICKUP</span>
                              </div>

                              <div>
                                <span className="text-gray-400 text-xs block font-bold">Counter Pickup Token</span>
                                <span className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-white">
                                  {order.order_code}
                                </span>
                              </div>

                              <div className="inline-block bg-white/10 border border-white/20 px-4 py-1.5 rounded-2xl">
                                <span className="text-[10px] uppercase font-bold text-gray-400 block leading-none">Instant Verification OTP</span>
                                <span className="text-xl font-black text-amber-300 tracking-widest font-mono">
                                  OTP: {order.pickup_otp || (order.order_code ? order.order_code.replace('SVKM-', '') : '8421')}
                                </span>
                              </div>

                              <p className="text-[11px] text-gray-300 font-medium">
                                📍 Please walk to <strong>{order.canteen_name} ({order.pickup_counter || 'Counter 1'})</strong>. Show this token & OTP to counter staff to collect your meal!
                              </p>

                              {/* Student self-confirm button */}
                              <button
                                onClick={() => confirmCollected(order.id)}
                                className="mt-1 inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition shadow-lg shadow-emerald-900/40"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>I've Collected My Order ✓</span>
                              </button>
                            </div>

                            <div className="bg-white p-2.5 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=SVKM_STUDENT_${order.order_code}_OTP_${order.pickup_otp || (order.order_code ? order.order_code.replace('SVKM-', '') : '8421')}`}
                                alt="Counter Pickup QR"
                                className="w-28 h-28 object-contain"
                              />
                              <span className="text-[9px] font-black text-gray-950 uppercase tracking-wider mt-1 block">
                                Counter Staff Scan
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dishes in this Order */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="font-semibold text-gray-800">
                          <span>{it.qty}x {it.name}</span>
                          {it.selected_customizations?.length > 0 && (
                            <span className="text-[10px] text-amber-700 ml-1.5">
                              (+{it.selected_customizations.map(c => c.name).join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Paid Amount</span>
                      <span className="text-base font-black text-gray-900">₹{order.total}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : orders.length > 0 ? (
          /* Recent Order Fallback Tracker */
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    All Active Kitchen Queues Clear!
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Showing your most recent order token below. You can track any token code above anytime.
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-2xl shadow-sm inline-flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <span>Order More 🍽️</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Display Most Recent Order */}
            {(() => {
              const recent = orders[0];
              const currentStep = getStepIndex(recent.status);
              return (
                <div key={recent.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-gray-900 font-heading">
                          Token: {recent.order_code}
                        </span>
                        <OrderStatusBadge status={recent.status} fulfillmentType={recent.fulfillment_type} />
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-violet-600" />
                        <span className="font-semibold">{recent.canteen_name}</span>
                        <span>•</span>
                        <span>{new Date(recent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-900">
                        {recent.status === 'Completed' ? 'Completed & Collected' : recent.status}
                      </span>
                    </div>
                  </div>

                  {/* Stepper for Recent Order */}
                  <div className="py-2">
                    <div className="grid grid-cols-4 relative">
                      <div className="absolute top-4 left-6 right-6 h-1 bg-gray-100 -z-0">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-500"
                          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                        />
                      </div>

                      {[
                        { step: 1, label: "Placed", icon: Clock },
                        { step: 2, label: "Cooking", icon: ChefHat },
                        { 
                          step: 3, 
                          label: recent.fulfillment_type === 'delivery' ? "Out for Delivery" : "Ready at Counter", 
                          icon: BellRing 
                        },
                        { 
                          step: 4, 
                          label: recent.fulfillment_type === 'delivery' ? "Delivered" : "Collected", 
                          icon: CheckCircle2 
                        },
                      ].map(({ step, label, icon: Icon }) => (
                        <div key={step} className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                            currentStep >= step ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-800 mt-1.5">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dishes in this Order */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      {recent.items.map((it, idx) => (
                        <div key={idx} className="font-semibold text-gray-800">
                          <span>{it.qty}x {it.name}</span>
                          {it.selected_customizations?.length > 0 && (
                            <span className="text-[10px] text-amber-700 ml-1.5">
                              (+{it.selected_customizations.map(c => c.name).join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Paid Amount</span>
                      <span className="text-base font-black text-gray-900">₹{recent.total}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-800 mb-1">No orders placed yet</h3>
            <p className="text-xs text-gray-400 mb-5">
              Explore snacks, Gujarati favorites, and refreshing drinks!
            </p>
            <Link
              to="/"
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm inline-flex items-center space-x-1"
            >
              <span>Explore Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )
      ) : (
        /* Tab 2: Past Orders & Review Option */
        completedOrders.length > 0 ? (
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-black text-gray-900 text-base">
                        Token: {order.order_code}
                      </span>
                      <OrderStatusBadge status={order.status} fulfillmentType={order.fulfillment_type} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {order.canteen_name} • {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-gray-900">₹{order.total}</span>
                    <span className="text-[10px] text-gray-400 block">{order.payment_method}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="text-xs text-gray-600 font-medium">
                  {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </div>

                {/* Review Section */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {order.review ? (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex-1 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < order.review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-[10px] text-amber-800 font-bold ml-1">
                            Your Review
                          </span>
                        </div>
                        {order.review.comment && (
                          <p className="text-[11px] text-gray-700 italic">"{order.review.comment}"</p>
                        )}
                        {order.review.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.review.tags.map((t, idx) => (
                              <span key={idx} className="text-[9px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">Submitted ✔️</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2 rounded-2xl text-xs font-bold transition self-start"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Rate & Review this Meal</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 text-gray-400 text-xs">
            No completed orders yet.
          </div>
        )
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <OrderReviewModal
          order={reviewOrder}
          isOpen={Boolean(reviewOrder)}
          onClose={() => setReviewOrder(null)}
          onReviewSubmitted={fetchOrders}
        />
      )}

    </div>
  );
}
