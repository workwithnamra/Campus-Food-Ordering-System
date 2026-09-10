import API_BASE from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Clock, Users, MapPin, Sparkles, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';

const defaultCanteens = [
  {
    id: 'ground',
    name: 'Ground Floor Plaza',
    ordersAhead: 0,
    prepWaitMins: 4,
    status: 'smooth',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    badge: 'Fast Moving ⚡'
  },
  {
    id: '6th_floor',
    name: '6th Floor Jain & Faculty',
    ordersAhead: 0,
    prepWaitMins: 5,
    status: 'smooth',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    badge: 'Pure Jain 🌿'
  },
  {
    id: '8th_floor',
    name: '8th Floor Sky Lounge',
    ordersAhead: 0,
    prepWaitMins: 4,
    status: 'smooth',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    badge: 'Asian & Desserts ✨'
  }
];

export default function CampusQueueRadar({ selectedCanteen, setSelectedCanteen, floorOnly, setFloorOnly }) {
  const [canteensData, setCanteensData] = useState(defaultCanteens);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRadarData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/queue-radar`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.radar) && data.radar.length > 0) {
          setCanteensData(data.radar);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Queue radar poll error:', err);
    }
  };

  useEffect(() => {
    fetchRadarData();
    const timer = setInterval(fetchRadarData, 3000);
    return () => clearInterval(timer);
  }, []);

  const totalCampusQueue = canteensData.reduce((acc, c) => acc + (c.ordersAhead || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm mb-6">
      
      {/* Radar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="font-heading font-black text-sm text-gray-900 flex items-center">
            <span>Live Campus Queue Radar</span>
            <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full ml-2">
              {totalCampusQueue} Active in Kitchens
            </span>
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-gray-400 hidden md:inline">
              • Synced {lastUpdated}
            </span>
          )}
        </div>

        {/* Floor Smart Filter Toggle */}
        <div className="flex items-center space-x-3">
          {selectedCanteen !== 'all' && (
            <button
              onClick={() => setSelectedCanteen('all')}
              className="text-[11px] text-violet-600 hover:text-violet-800 font-bold underline cursor-pointer"
            >
              Reset to All Floors
            </button>
          )}
          <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
            <input 
              type="checkbox"
              checked={floorOnly}
              onChange={(e) => setFloorOnly(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded"
            />
            <span className="text-xs font-bold text-gray-700">
              Selected floor only (No stairs 🏃)
            </span>
          </label>
        </div>
      </div>

      {/* 3 Canteens Live Crowd Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {canteensData.map((c) => {
          const isSelected = selectedCanteen === c.id;

          return (
            <div
              key={c.id}
              onClick={() => setSelectedCanteen(isSelected ? 'all' : c.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-violet-600 bg-violet-50/70 shadow-sm ring-2 ring-violet-500'
                  : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/70 hover:border-gray-200'
              }`}
              title={isSelected ? 'Click to deselect (Show all floors)' : `Click to show only ${c.name}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-gray-900 truncate">
                  {c.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${c.statusColor}`}>
                  {c.badge}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${c.dotColor} animate-pulse`} />
                  <span className="font-semibold">{c.ordersAhead} in queue</span>
                </div>
                
                <div className="flex items-center space-x-1 font-black text-gray-900">
                  <Clock className="w-3.5 h-3.5 text-violet-600" />
                  <span>~{c.prepWaitMins}m wait</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
