import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChefHat, 
  Plus, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  RefreshCw, 
  Search,
  MapPin,
  Leaf,
  ExternalLink,
  Package,
  BarChart3,
  Sparkles,
  Check,
  AlertCircle,
  ShieldAlert,
  Tag
} from 'lucide-react';
import AdminInventoryTable from '../components/AdminInventoryTable';
import DishFormModal from '../components/DishFormModal';
import AdminCouponsTable from '../components/AdminCouponsTable';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'stats'
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pickup' | 'delivery'
  const [filterStatus, setFilterStatus] = useState('active'); // 'active' | 'all' | 'completed'

  // Dish Form Modal State (for Add & Edit)
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  const { showToast } = useToast();
  const [lastSync, setLastSync] = useState(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ordersRes, menuRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/menu'),
        fetch('http://localhost:5000/api/admin/stats')
      ]);

      if (!ordersRes.ok || !menuRes.ok || !statsRes.ok) {
        throw new Error('One or more admin API requests failed');
      }

      const [ordersData, menuData, statsData] = await Promise.all([
        ordersRes.json(),
        menuRes.json(),
        statsRes.json()
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMenu(menuData.items || []);
      setStats(statsData);
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (!silent) showToast('Failed to connect to backend — is it running?', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    // Fast 3s polling for live kitchen display
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
  }, []);

  // 1. Save Dish (Create or Update)
  const handleSaveDish = async (payload, editId) => {
    try {
      const url = editId 
        ? `http://localhost:5000/api/admin/menu/${editId}`
        : 'http://localhost:5000/api/admin/menu';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save dish');
      }

      const savedItem = await res.json();

      // Optimistic update
      if (editId) {
        setMenu(prev => prev.map(i => i.id === editId ? { ...i, ...savedItem } : i));
        showToast(`"${savedItem.name}" updated successfully! 🎉`);
      } else {
        setMenu(prev => [savedItem, ...prev]);
        showToast(`"${savedItem.name}" published to menu! 🍽️`);
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // 2. Quick Toggle Stock (In Stock / Low Stock / Sold Out)
  const handleQuickToggleStock = async (id, newStatus) => {
    // Optimistic update
    setMenu(prev => prev.map(i => i.id === id ? { ...i, stock_status: newStatus } : i));
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/menu/${id}/quick-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'stock_status', value: newStatus })
      });
      if (res.ok) {
        const label = newStatus === 'in_stock' ? 'In Stock' : newStatus === 'low_quantity' ? 'Low Stock' : 'Sold Out';
        showToast(`Item marked as ${label}`);
      }
    } catch (err) {
      showToast('Failed to update stock status', 'error');
      fetchData(); // Rollback
    }
  };

  // 3. Quick Toggle Floor Availability
  const handleQuickToggleFloor = async (id, floorId) => {
    const item = menu.find(i => i.id === id);
    if (!item) return;

    const currentFloors = item.canteen_ids || ['ground', '6th_floor', '8th_floor'];
    let updatedFloors;
    if (currentFloors.includes(floorId)) {
      if (currentFloors.length === 1) {
        showToast('A dish must be available on at least one floor', 'error');
        return;
      }
      updatedFloors = currentFloors.filter(f => f !== floorId);
    } else {
      updatedFloors = [...currentFloors, floorId];
    }

    // Optimistic update
    setMenu(prev => prev.map(i => i.id === id ? { ...i, canteen_ids: updatedFloors } : i));

    try {
      const res = await fetch(`http://localhost:5000/api/admin/menu/${id}/quick-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'floor', value: floorId })
      });
      if (res.ok) {
        showToast(`Floor availability updated`);
      }
    } catch (err) {
      showToast('Failed to update floor availability', 'error');
      fetchData();
    }
  };

  // 4. Delete Dish
  const handleDeleteDish = async (id) => {
    const itemToDelete = menu.find(i => i.id === id);
    setMenu(prev => prev.filter(i => i.id !== id));

    try {
      const res = await fetch(`http://localhost:5000/api/admin/menu/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`"${itemToDelete?.name || 'Dish'}" removed from menu.`);
      }
    } catch (err) {
      showToast('Failed to delete dish', 'error');
      fetchData();
    }
  };

  // 5. Update Order Status (KDS)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Order status updated to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  // Filter orders for KDS
  const filteredOrders = orders
    .filter(o => {
      if (filterFloor !== 'all' && o.canteen_id !== filterFloor) return false;
      if (filterType === 'pickup' && o.fulfillment_type === 'delivery') return false;
      if (filterType === 'delivery' && o.fulfillment_type !== 'delivery') return false;
      if (filterStatus === 'active' && (o.status === 'Completed' || o.status === 'Cancelled')) return false;
      if (filterStatus === 'completed' && o.status !== 'Completed') return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize Placed and Preparing over Ready and Completed
      const rank = { Placed: 0, Preparing: 1, Ready: 2, Completed: 3, Cancelled: 4 };
      const rankA = rank[a.status] ?? 5;
      const rankB = rank[b.status] ?? 5;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  // Calculate quick stock metrics
  const inStockCount = menu.filter(i => !i.stock_status || i.stock_status === 'in_stock').length;
  const lowStockCount = menu.filter(i => i.stock_status === 'low_quantity').length;
  const soldOutCount = menu.filter(i => i.stock_status === 'out_of_stock').length;

  // Strict Access Guard: Only admin role can access Admin Panel
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-heading text-gray-900 mb-2">
          Admin Access Required
        </h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          The Cafeteria Admin &amp; Kitchen Command Panel is strictly restricted to cafeteria administrators. You are currently logged in as <strong>{user?.name || 'User'} ({user?.role || 'student'})</strong>.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2.5 rounded-2xl text-xs shadow-md transition text-center"
          >
            Return to Student Menu
          </Link>
          <Link
            to="/auth"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-2.5 rounded-2xl text-xs transition text-center"
          >
            Switch to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Modern, Airy Admin Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-600">
              SVKM Central Kitchen Control
            </span>
            {lastSync && (
              <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                • Synced {lastSync}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-gray-950 mt-1">
            Cafeteria Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage cafeteria inventory, dish images, stock availability, and live floor orders.
          </p>
        </div>

        {/* View Switcher: Live Menu View <---> Admin Mode */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
            <Link
              to="/"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-gray-600 hover:text-gray-950 transition"
              title="Switch to customer live menu"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Menu View</span>
            </Link>

            <span className="px-3 py-1.5 rounded-xl bg-violet-600 text-white shadow-xs flex items-center space-x-1.5 font-black">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin Mode</span>
            </span>
          </div>

          <button
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-100 rounded-2xl transition border border-gray-200"
            title="Refresh latest data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spacious Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Total Menu Items</span>
          <span className="text-2xl font-black text-gray-950 font-heading block mt-1">{menu.length}</span>
          <span className="text-[11px] text-gray-500 font-semibold mt-0.5 block">Across 3 Canteen Floors</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Stock Health</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-black text-emerald-600 font-heading">{inStockCount} In</span>
            <span className="text-gray-300">•</span>
            <span className="text-xl font-black text-rose-600 font-heading">{soldOutCount} Out</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">{lowStockCount} Low stock items</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Active Kitchen Orders</span>
          <span className="text-2xl font-black text-violet-700 font-heading block mt-1">{stats?.activeOrders ?? 0}</span>
          <span className="text-[11px] text-gray-500 font-semibold mt-0.5 block">Cooking or Ready for Dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Today's Revenue</span>
          <span className="text-2xl font-black text-emerald-700 font-heading block mt-1">₹{stats?.totalRevenue ?? 0}</span>
          <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">Live Settled UPI Orders</span>
        </div>
      </div>

      {/* Clean Navigation Tabs */}
      <div className="flex space-x-2 border-b border-gray-200/80 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'inventory'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Menu & Inventory Management ({menu.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Live Kitchen Display (KDS)</span>
          {stats?.activeOrders > 0 && (
            <span className="bg-white text-violet-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {stats.activeOrders}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'coupons'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promo &amp; Offers</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'stats'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Revenue & Analytics</span>
        </button>
      </div>

      {/* TAB 1: MENU & INVENTORY CRUD */}
      {activeTab === 'inventory' && (
        <AdminInventoryTable
          menu={menu}
          onEditDish={(dish) => {
            setEditingDish(dish);
            setShowDishModal(true);
          }}
          onDeleteDish={handleDeleteDish}
          onQuickToggleStock={handleQuickToggleStock}
          onQuickToggleFloor={handleQuickToggleFloor}
          onOpenAddModal={() => {
            setEditingDish(null);
            setShowDishModal(true);
          }}
        />
      )}

      {/* TAB 2: LIVE KITCHEN DISPLAY SYSTEM */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Canteen Floor & Dispatch Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs">
            {/* Floor selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 mr-1">
                <MapPin className="w-4 h-4 text-violet-600" />
                <span>Floor:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All 3 Floors' },
                  { id: 'ground', label: 'Ground Floor' },
                  { id: '6th_floor', label: '6th Floor' },
                  { id: '8th_floor', label: '8th Floor' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterFloor(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      filterFloor === tab.id
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Pipeline Filter: Active vs All vs Completed */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
              <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {[
                  { id: 'active', label: '🔥 Active Cooking' },
                  { id: 'all', label: 'All' },
                  { id: 'completed', label: '✔️ Completed' },
                ].map(sTab => (
                  <button
                    key={sTab.id}
                    onClick={() => setFilterStatus(sTab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterStatus === sTab.id
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sTab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dispatch / Fulfillment filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Dispatch:</span>
              <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pickup', label: '🚶 Student Pickups' },
                  { id: 'delivery', label: '🚀 Faculty Deliveries' },
                ].map(typeTab => (
                  <button
                    key={typeTab.id}
                    onClick={() => setFilterType(typeTab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterType === typeTab.id
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {typeTab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-8">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-heading font-black text-gray-700 text-lg">No Orders in this View</h3>
                <p className="text-xs text-gray-400 mt-1">Try switching the floor or dispatch filter tabs above.</p>
              </div>
            ) : filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Header with Token Code & Floor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black font-heading text-gray-950">
                      Token: {order.order_code}
                    </span>
                    <OrderStatusBadge status={order.status} fulfillmentType={order.fulfillment_type} />
                  </div>
                  
                  <div className="text-xs text-gray-500 font-semibold flex items-center justify-between">
                    <span>{order.user_name}</span>
                    <span className="bg-violet-50 text-violet-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {order.canteen_name}
                    </span>
                  </div>

                  {/* Fulfillment Differentiation Banner */}
                  {order.fulfillment_type === 'delivery' ? (
                    <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 flex items-center space-x-1">
                          <span>🚀 FACULTY CABIN DELIVERY</span>
                        </span>
                        <span className="bg-amber-200 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-md">
                          Runner Required
                        </span>
                      </div>
                      <div className="text-xs text-amber-950 font-bold">
                        📍 {order.delivery_location || 'Faculty Cabin'}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">🚶</span>
                        <div>
                          <span className="text-[10px] uppercase font-black text-blue-900 block">
                            Student Self-Pickup
                          </span>
                          <span className="text-xs font-bold text-blue-800">
                            Counter: {order.pickup_counter || 'Counter 1'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Verify OTP</span>
                        <span className="text-xs font-black font-mono text-blue-900">
                          {order.pickup_otp || (order.order_code ? order.order_code.replace('SVKM-', '') : '8421')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items in the Order */}
                <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2 border border-gray-100 text-xs">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block">
                    Dishes to Prepare:
                  </span>
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start font-medium">
                      <div>
                        <span className="font-bold text-gray-900">{it.qty}x {it.name}</span>
                        {it.selected_customizations && it.selected_customizations.length > 0 && (
                          <span className="block text-[10px] text-amber-700 font-bold">
                            + {it.selected_customizations.map(c => c.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-600">₹{(it.unit_price || it.price) * it.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Total & Status Transition Controls */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-400">Total Bill:</span>
                    <span className="text-base text-gray-950 font-black">₹{order.total} ({order.payment_method})</span>
                  </div>

                  {/* Advance Kitchen Pipeline Buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      disabled={order.status === 'Preparing' || order.status === 'Completed'}
                      className={`p-2 rounded-xl text-[11px] font-bold transition text-center ${
                        order.status === 'Preparing' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      Cook 🍳
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Ready')}
                      disabled={order.status === 'Ready' || order.status === 'Completed'}
                      className={`p-2 rounded-xl text-[11px] font-bold transition text-center ${
                        order.status === 'Ready' 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      {order.fulfillment_type === 'delivery' ? 'Dispatch 🚀' : 'Ready 🔔'}
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Completed')}
                      disabled={order.status === 'Completed'}
                      className={`p-2 rounded-xl text-[11px] font-bold transition text-center ${
                        order.status === 'Completed' 
                          ? 'bg-gray-800 text-white shadow-xs' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {order.fulfillment_type === 'delivery' ? 'Delivered ✔️' : 'Done ✔️'}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PROMOS & OFFERS */}
      {activeTab === 'coupons' && (
        <AdminCouponsTable showToast={showToast} />
      )}

      {/* TAB 3: REVENUE & ANALYTICS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-heading font-black text-gray-900">Cafeteria Floor Volume & Settlements</h3>
              <p className="text-xs text-gray-500 mt-1">Real-time order distribution across campus floors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-black uppercase text-amber-700 block">Ground Floor Plaza</span>
                <span className="text-2xl font-black font-heading text-gray-950 block mt-1">
                  {stats.canteenCounts?.ground || 0} orders
                </span>
                <p className="text-xs text-gray-500 mt-1">Street food, Pav Bhaji, Quick snacks</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-black uppercase text-emerald-700 block">6th Floor Jain Hub</span>
                <span className="text-2xl font-black font-heading text-gray-950 block mt-1">
                  {stats.canteenCounts?.['6th_floor'] || 0} orders
                </span>
                <p className="text-xs text-gray-500 mt-1">Pure Jain kitchen, Faculty dining</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-black uppercase text-indigo-700 block">8th Floor Sky Lounge</span>
                <span className="text-2xl font-black font-heading text-gray-950 block mt-1">
                  {stats.canteenCounts?.['8th_floor'] || 0} orders
                </span>
                <p className="text-xs text-gray-500 mt-1">Gourmet Wok, Smoothies & Bakery</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      <DishFormModal
        isOpen={showDishModal}
        onClose={() => {
          setShowDishModal(false);
          setEditingDish(null);
        }}
        initialData={editingDish}
        onSave={handleSaveDish}
      />

    </div>
  );
}
