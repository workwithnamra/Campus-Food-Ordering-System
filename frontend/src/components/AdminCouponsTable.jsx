import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Edit3, 
  X, 
  Save, 
  Sparkles,
  Users,
  Percent,
  Check,
  Power
} from 'lucide-react';

export default function AdminCouponsTable({ showToast }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWindowCoupon, setEditingWindowCoupon] = useState(null);
  const [newWindowStart1, setNewWindowStart1] = useState('09:00');
  const [newWindowEnd1, setNewWindowEnd1] = useState('11:30');
  const [newWindowStart2, setNewWindowStart2] = useState('15:00');
  const [newWindowEnd2, setNewWindowEnd2] = useState('17:00');

  // Add Coupon Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('percent'); // 'percent' | 'flat'
  const [newDiscountVal, setNewDiscountVal] = useState(15);
  const [newMinOrder, setNewMinOrder] = useState(100);
  const [newCouponType, setNewCouponType] = useState('regular'); // 'time_restricted' | 'group' | 'first_order' | 'regular'

  // Live IST Time Indicator
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isCurrentlyOffPeak, setIsCurrentlyOffPeak] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/coupons');
      const data = await res.json();
      setCoupons(data);
    } catch (err) {
      if (showToast) showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();

    const updateClock = () => {
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
        const currentHHMM = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        setCurrentTimeStr(currentHHMM);

        // Check if in standard off-peak (09:00-11:30 or 15:00-17:00)
        const offPeak = (currentHHMM >= '09:00' && currentHHMM <= '11:30') || (currentHHMM >= '15:00' && currentHHMM <= '17:00');
        setIsCurrentlyOffPeak(offPeak);
      } catch (e) {}
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleActive = async (coupon) => {
    const nextState = !coupon.is_active;
    // Optimistic
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: nextState } : c));

    try {
      const res = await fetch(`http://localhost:5000/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextState })
      });
      if (res.ok) {
        if (showToast) showToast(`Coupon '${coupon.code}' is now ${nextState ? 'ACTIVE' : 'PAUSED'}`);
      } else {
        fetchCoupons();
      }
    } catch (err) {
      if (showToast) showToast('Failed to update coupon status', 'error');
      fetchCoupons();
    }
  };

  const openWindowEditModal = (coupon) => {
    setEditingWindowCoupon(coupon);
    const windows = coupon.off_peak_windows || [];
    if (windows[0]) {
      setNewWindowStart1(windows[0].start || '09:00');
      setNewWindowEnd1(windows[0].end || '11:30');
    }
    if (windows[1]) {
      setNewWindowStart2(windows[1].start || '15:00');
      setNewWindowEnd2(windows[1].end || '17:00');
    }
  };

  const handleSaveWindows = async () => {
    if (!editingWindowCoupon) return;
    const updatedWindows = [
      { start: newWindowStart1, end: newWindowEnd1 },
      { start: newWindowStart2, end: newWindowEnd2 }
    ];

    try {
      const res = await fetch(`http://localhost:5000/api/admin/coupons/${editingWindowCoupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ off_peak_windows: updatedWindows })
      });
      if (res.ok) {
        if (showToast) showToast(`Off-peak hours for '${editingWindowCoupon.code}' updated!`);
        setEditingWindowCoupon(null);
        fetchCoupons();
      }
    } catch (err) {
      if (showToast) showToast('Failed to save off-peak windows', 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCode) return;

    const payload = {
      code: newCode.trim().toUpperCase(),
      description: newDesc,
      discount_percent: newDiscountType === 'percent' ? Number(newDiscountVal) : undefined,
      discount_flat: newDiscountType === 'flat' ? Number(newDiscountVal) : undefined,
      min_order: Number(newMinOrder) || 0,
      type: newCouponType,
      off_peak_windows: newCouponType === 'time_restricted' ? [
        { start: newWindowStart1, end: newWindowEnd1 },
        { start: newWindowStart2, end: newWindowEnd2 }
      ] : []
    };

    try {
      const res = await fetch('http://localhost:5000/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (showToast) showToast(`Created new promo '${newCode.toUpperCase()}'!`);
        setShowAddModal(false);
        setNewCode('');
        setNewDesc('');
        fetchCoupons();
      }
    } catch (err) {
      if (showToast) showToast('Failed to create coupon', 'error');
    }
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.redemption_count || 0), 0);
  const activeCount = coupons.filter(c => c.is_active).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-violet-600" />
            <h2 className="text-xl font-black font-heading text-gray-950">
              Campus Promos &amp; Off-Peak Demand Control
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Incentivize cafeteria orders outside peak lunch rush (12:00 - 2:30 PM) to balance kitchen lines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Campus Time & Rush Status */}
          <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
            isCurrentlyOffPeak 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <Clock className="w-4 h-4" />
            <div>
              <span className="block text-[10px] uppercase font-black text-gray-400">Campus IST: {currentTimeStr}</span>
              <span>{isCurrentlyOffPeak ? '🟢 Off-Peak Window Active' : '🔴 Peak Lunch Rush Hour'}</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Active Promos</span>
          <span className="text-2xl font-black text-gray-900 block mt-0.5">{activeCount} / {coupons.length}</span>
          <span className="text-[11px] text-gray-500 font-medium">Available for students at checkout</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Total Redemptions</span>
          <span className="text-2xl font-black text-violet-700 block mt-0.5">{totalRedemptions} Orders</span>
          <span className="text-[11px] text-gray-500 font-medium">Driven by student discounts</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Off-Peak Sales Boost</span>
          <span className="text-2xl font-black text-emerald-600 block mt-0.5">+34% Off-Peak</span>
          <span className="text-[11px] text-gray-500 font-medium">Via HAPPYHOUR15 demand shift</span>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs uppercase font-black text-gray-400 tracking-wider">
            All Configured Coupons &amp; Time Rules
          </span>
          <span className="text-xs text-gray-400">{coupons.length} total codes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] uppercase font-black text-gray-400 tracking-wider">
                <th className="py-3.5 px-5">Coupon Code</th>
                <th className="py-3.5 px-4">Type &amp; Rule</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Off-Peak Window</th>
                <th className="py-3.5 px-4 text-center">Redemptions</th>
                <th className="py-3.5 px-5 text-right">Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {coupons.map((c) => {
                const isTimeRestricted = c.type === 'time_restricted' || (c.off_peak_windows && c.off_peak_windows.length > 0);

                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition">
                    
                    {/* Code & Description */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs text-violet-900 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-xl">
                          {c.code}
                        </span>
                        {c.type === 'time_restricted' && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                            ⏰ Off-Peak
                          </span>
                        )}
                        {c.type === 'group' && (
                          <span className="text-[9px] bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                            👥 Group
                          </span>
                        )}
                        {c.type === 'first_order' && (
                          <span className="text-[9px] bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                            ⭐ First Order
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium mt-1 leading-snug max-w-sm">
                        {c.description}
                      </p>
                    </td>

                    {/* Type & Rule */}
                    <td className="py-4 px-4">
                      {c.min_order > 0 ? (
                        <span className="text-[11px] font-bold text-gray-800">
                          Min Order: ₹{c.min_order}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">No Minimum</span>
                      )}
                    </td>

                    {/* Discount Value */}
                    <td className="py-4 px-4">
                      <span className="font-heading font-black text-gray-900 text-sm">
                        {c.discount_percent ? `${c.discount_percent}% OFF` : `₹${c.discount_flat} FLAT`}
                      </span>
                      {c.max_discount && (
                        <span className="text-[10px] text-gray-400 block font-medium">
                          Up to ₹{c.max_discount}
                        </span>
                      )}
                    </td>

                    {/* Off-Peak Time Windows */}
                    <td className="py-4 px-4">
                      {isTimeRestricted ? (
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg inline-block">
                            {(c.off_peak_windows || []).map((w, idx) => (
                              <span key={idx} className="block">
                                • {w.start} - {w.end}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => openWindowEditModal(c)}
                            className="text-[10px] text-violet-600 hover:text-violet-800 font-bold block hover:underline"
                          >
                            Edit Hours ✏️
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">All Day (Anytime)</span>
                      )}
                    </td>

                    {/* Redemptions */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 font-black text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
                        <span>{c.redemption_count || 0}</span>
                        <span className="text-[10px] text-gray-400 font-normal">uses</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{c.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Off-Peak Windows */}
      {editingWindowCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-violet-600" />
                <h3 className="font-heading font-black text-gray-950 text-base">
                  Edit Off-Peak Windows ({editingWindowCoupon.code})
                </h3>
              </div>
              <button onClick={() => setEditingWindowCoupon(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Define the non-peak hours when <strong>{editingWindowCoupon.code}</strong> can be redeemed by students. Attempting to use this during peak lunch rush will show a friendly alert.
            </p>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-500 block">
                  Morning Off-Peak Slot 1
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block">Start Time (24h)</label>
                    <input
                      type="time"
                      value={newWindowStart1}
                      onChange={(e) => setNewWindowStart1(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block">End Time (24h)</label>
                    <input
                      type="time"
                      value={newWindowEnd1}
                      onChange={(e) => setNewWindowEnd1(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-500 block">
                  Afternoon Off-Peak Slot 2
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block">Start Time (24h)</label>
                    <input
                      type="time"
                      value={newWindowStart2}
                      onChange={(e) => setNewWindowStart2(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block">End Time (24h)</label>
                    <input
                      type="time"
                      value={newWindowEnd2}
                      onChange={(e) => setNewWindowEnd2(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setEditingWindowCoupon(null)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWindows}
                className="px-5 py-2 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save Windows</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Coupon */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-violet-600" />
                <h3 className="font-heading font-black text-gray-950 text-base">
                  Create Campus Promo Code
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. EXAMBOOST"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl font-mono font-black uppercase text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                  Description / Benefit
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% off during Exam Prep Week"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-bold bg-white"
                  >
                    <option value="percent">Percentage (% Off)</option>
                    <option value="flat">Flat Amount (₹ Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                    Value ({newDiscountType === 'percent' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    value={newDiscountVal}
                    onChange={(e) => setNewDiscountVal(e.target.value)}
                    required
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-1">
                    Rule Category
                  </label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-bold bg-white"
                  >
                    <option value="regular">Regular Anytime</option>
                    <option value="time_restricted">Off-Peak Hours Only</option>
                    <option value="group">Study Group (Bulk)</option>
                    <option value="first_order">New Student First Order</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                  Create Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
