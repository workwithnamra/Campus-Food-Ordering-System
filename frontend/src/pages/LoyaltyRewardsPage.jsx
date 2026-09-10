import API_BASE from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Trophy, Award, Copy, Check, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoyaltyRewardsPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [scratchRevealed, setScratchRevealed] = useState(false);

  const count = user?.loyalty_count || 0;
  const progress = count % 5;
  const ordersRemaining = 5 - progress;

  useEffect(() => {
    fetch(`${API_BASE}/api/coupons`)
      .then(res => res.json())
      .then(data => setCoupons(data))
      .catch(err => console.error(err));
  }, []);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black uppercase mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>SVKM Student Loyalty Program</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading text-gray-900">
          Eat More, Earn Freebies!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">
          Place orders at any of the 3 SVKM canteens. For every 5 orders, unlock guaranteed discount coupons and surprise snacks!
        </p>
      </div>

      {/* Gamified Milestone Card */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase font-black bg-white/20 px-3 py-1 rounded-full text-yellow-300">
              Active Milestone
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading">
              Current Cycle: {progress} / 5 Orders
            </h2>
            <p className="text-xs text-white/80 max-w-md">
              {progress === 0 && count > 0 ? (
                "🎉 You've reached your 5th order milestone! Your mystery coupon is unlocked below!"
              ) : (
                `Place ${ordersRemaining} more order${ordersRemaining > 1 ? 's' : ''} to claim your guaranteed reward coupon!`
              )}
            </p>
          </div>

          {/* Radial / Progress Visual */}
          <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10">
            {[1, 2, 3, 4, 5].map((step) => {
              const isDone = step <= progress;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md transition-all ${
                    isDone 
                      ? 'bg-amber-400 text-gray-950 scale-105' 
                      : 'bg-white/20 text-white/60'
                  }`}>
                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : step}
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-white/80">
                    {step === 5 ? '🎁 GIFT' : `#${step}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Mystery Scratch Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
        <h3 className="text-lg font-black font-heading text-gray-900 mb-1 flex items-center justify-center space-x-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <span>Mystery Student Coupon Scratch Card</span>
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Tap below to reveal this week's surprise cafeteria coupon!
        </p>

        <div className="max-w-md mx-auto">
          {!scratchRevealed ? (
            <button
              onClick={() => setScratchRevealed(true)}
              className="w-full h-32 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-gray-950 font-heading font-black text-lg shadow-xl shadow-amber-200 hover:scale-102 active:scale-98 transition flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-amber-600 cursor-pointer"
            >
              <Sparkles className="w-8 h-8 text-amber-900 animate-spin" />
              <span>TAP TO SCRATCH & REVEAL CODE!</span>
            </button>
          ) : (
            <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 animate-scaleUp">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2.5 py-1 rounded-full">
                🎉 Revealed Voucher!
              </span>
              <h4 className="text-3xl font-black font-heading text-emerald-900 mt-3 tracking-widest">
                SVKM50
              </h4>
              <p className="text-xs text-emerald-700 font-medium mt-1 mb-4">
                50% OFF up to ₹100 on all Jain & Gujarati dishes!
              </p>
              <button
                onClick={() => copyToClipboard('SVKM50', 'scratch')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md inline-flex items-center space-x-1.5 transition"
              >
                {copiedId === 'scratch' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'scratch' ? 'Copied to Clipboard!' : 'Copy Voucher Code'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Available Coupons List */}
      <div className="space-y-4">
        <h3 className="text-xl font-black font-heading text-gray-900 flex items-center space-x-2">
          <Tag className="w-5 h-5 text-violet-600" />
          <span>Active Cafeteria Coupons</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:border-violet-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black text-violet-800 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg">
                    {coupon.code}
                  </span>
                  <p className="text-xs text-gray-700 font-bold mt-2.5 leading-snug">
                    {coupon.description}
                  </p>
                  {coupon.min_order && (
                    <span className="text-[10px] text-gray-400 font-semibold block mt-1">
                      Min order: ₹{coupon.min_order}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => copyToClipboard(coupon.code, coupon.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition"
                  title="Copy code"
                >
                  {copiedId === coupon.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified Active
                </span>
                <Link
                  to="/"
                  className="text-xs font-bold text-violet-600 hover:text-violet-800 inline-flex items-center space-x-1"
                >
                  <span>Use in Menu</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
