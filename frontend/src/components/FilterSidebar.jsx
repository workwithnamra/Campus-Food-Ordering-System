import React from 'react';
import { SlidersHorizontal, RotateCcw, Flame, ArrowUpDown, Tag, DollarSign, Compass } from 'lucide-react';

export const CUISINES = [
  { id: 'all', label: 'All Cuisines', emoji: '🍽️' },
  { id: 'Gujarat', label: 'Gujarat Special', emoji: '🌿' },
  { id: 'Maharashtra', label: 'Mumbai Street', emoji: '🥪' },
  { id: 'South India', label: 'South Indian', emoji: '🫓' },
  { id: 'Pan-Asian', label: 'Chinese & Asian', emoji: '🍜' },
  { id: 'North India', label: 'North Indian', emoji: '🍲' },
  { id: 'Global', label: 'Continental & Fitness', emoji: '🥗' },
];

export const CATEGORIES = [
  'All',
  'Gujarati Special',
  'Main Course',
  'South Indian',
  'Chinese',
  'Sushi',
  'Snacks',
  'Beverages',
  'Juices',
  'Desserts',
  'Ice Cream',
  'Protein Bars',
  'Chips & Chocolates'
];

export default function FilterSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedCuisine,
  setSelectedCuisine,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  resetFilters,
  totalResults
}) {
  return (
    <aside className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-6">
      
      {/* Header with Results Count & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-5 h-5 text-violet-600" />
          <h3 className="font-heading font-extrabold text-gray-900 text-lg">Filters</h3>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center space-x-1 text-xs text-gray-400 hover:text-violet-600 transition font-bold"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-violet-600 mr-1.5" />
          Sort Dishes By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-violet-600 focus:bg-white transition"
        >
          <option value="popular">🔥 Most Popular (Reviews)</option>
          <option value="rating">⭐ Highest Rated (4.8+)</option>
          <option value="price_asc">💵 Price: Low to High</option>
          <option value="price_desc">💎 Price: High to Low</option>
        </select>
      </div>

      {/* Regional State Cuisines (Requested Feature) */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center">
          <Compass className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
          Regional Cuisines
        </label>
        <div className="space-y-1">
          {CUISINES.map((cuisine) => {
            const isSelected = selectedCuisine.toLowerCase() === cuisine.id.toLowerCase();
            return (
              <button
                key={cuisine.id}
                onClick={() => setSelectedCuisine(cuisine.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{cuisine.emoji}</span>
                  <span>{cuisine.label}</span>
                </span>
                {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            Max Price
          </label>
          <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
            Up to ₹{maxPrice}
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="350"
          step="10"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
          <span>₹30</span>
          <span>₹180</span>
          <span>₹350</span>
        </div>
      </div>

      {/* Categories List */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center">
          <Tag className="w-3.5 h-3.5 text-pink-500 mr-1.5" />
          Food Categories
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition ${
                  isSelected
                    ? 'bg-amber-500 text-gray-950 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Summary */}
      <div className="pt-4 border-t border-gray-100 text-center">
        <span className="text-xs text-gray-400 font-semibold">
          Showing <strong className="text-violet-700 font-black">{totalResults}</strong> dishes
        </span>
      </div>

    </aside>
  );
}
