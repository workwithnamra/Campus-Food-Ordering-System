import React from 'react';
import { Gift, Sparkles, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoyaltyBanner() {
  const { user } = useAuth();
  if (!user || user.role === 'admin') return null;

  const count = user.loyalty_count || 0;
  const currentProgress = count % 5;
  const ordersNeeded = 5 - currentProgress;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white p-5 sm:p-6 shadow-xl shadow-orange-500/10 mb-8">
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Gamified info */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
            <Gift className="w-6 h-6 text-yellow-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest font-black bg-white/25 px-2 py-0.5 rounded-full text-yellow-100">
                SVKM VIP Perk
              </span>
              <span className="text-xs font-bold text-yellow-200 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                5th Order Freebie Milestone
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight mt-0.5">
              {currentProgress === 0 && count > 0 
                ? "🎉 Milestone Reached! You have an unlocked coupon!"
                : `Order ${currentProgress}/5 • Just ${ordersNeeded} more for your surprise coupon!`}
            </h3>
            <p className="text-xs text-white/85 font-medium mt-1">
              Every 5th order at SVKM Canteen unlocks exclusive student freebies like Flat ₹80 OFF or Sizzling Brownies!
            </p>
          </div>
        </div>

        {/* Right: 5-step Milestone Dots & Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          
          {/* 5 Dots Progress */}
          <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3 py-2 rounded-2xl">
            {[1, 2, 3, 4, 5].map((step) => {
              const isCompleted = step <= currentProgress;
              const isCurrent = step === currentProgress + 1;
              return (
                <div key={step} className="flex items-center">
                  <div 
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted 
                        ? 'bg-yellow-300 text-gray-950 scale-105 shadow' 
                        : isCurrent
                        ? 'bg-white text-orange-600 ring-2 ring-yellow-300'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-800" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`w-3 h-0.5 mx-0.5 ${step < currentProgress ? 'bg-yellow-300' : 'bg-white/20'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Link to Loyalty Page */}
          <Link
            to="/loyalty"
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-white hover:bg-yellow-50 text-gray-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition active:scale-95"
          >
            <span>My Rewards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
