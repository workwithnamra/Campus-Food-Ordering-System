import React from 'react';
import { X, ArrowUpDown, SlidersHorizontal, Compass, Tag, DollarSign, Check, RotateCcw } from 'lucide-react';
import { CUISINES, CATEGORIES } from './FilterSidebar';

export default function FilterModal({
  isOpen,
  onClose,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-violet-600" />
            <h3 className="font-heading font-extrabold text-gray-900 text-lg">
              Sort & Filter
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-violet-600 font-bold transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Options */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. Sort Options */}
          <div>
            <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2.5 flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-violet-600 mr-1.5" />
              Sort By
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'popular', label: '🔥 Most Popular' },
                { id: 'rating', label: '⭐ Highest Rated' },
                { id: 'price_asc', label: '💵 Price: Low to High' },
                { id: 'price_desc', label: '💎 Price: High to Low' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`p-3 rounded-2xl border text-left font-bold transition flex items-center justify-between ${
                    sortBy === opt.id
                      ? 'border-violet-600 bg-violet-50 text-violet-900 ring-1 ring-violet-500'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-4 h-4 text-violet-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Regional Cuisines */}
          <div>
            <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2.5 flex items-center">
              <Compass className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Regional Specialties
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CUISINES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCuisine(c.id)}
                  className={`p-2.5 rounded-2xl border font-bold transition text-left flex items-center justify-between ${
                    selectedCuisine.toLowerCase() === c.id.toLowerCase()
                      ? 'border-violet-600 bg-violet-50 text-violet-900 ring-1 ring-violet-500'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <span>{c.emoji}</span>
                    <span className="truncate">{c.label}</span>
                  </span>
                  {selectedCuisine.toLowerCase() === c.id.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                Maximum Price
              </span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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

          {/* 4. Food Category */}
          <div>
            <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2.5 flex items-center">
              <Tag className="w-3.5 h-3.5 text-pink-500 mr-1.5" />
              Category
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-bold transition ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold">
            <strong className="text-gray-900 font-black">{totalResults}</strong> dishes match
          </span>

          <button
            onClick={onClose}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-violet-200 transition"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
}
