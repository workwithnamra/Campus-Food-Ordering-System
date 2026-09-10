import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Utensils, Check, X } from 'lucide-react';

export const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories', sub: 'Show all 80 curated dishes & combos', icon: '🍽️', type: 'reset' },
  { id: 'combos', label: 'Combos & Value Meals', sub: 'Pav Bhaji Combo, Thali Bundles, Burger Meals', icon: '🍱', cat: 'Combos & Value Meals', cuisine: 'all' },
  { id: 'street_food', label: 'Street Food & Chaat', sub: 'Pav Bhaji, Vada Pav, Samosa, Chaat', icon: '🥪', cat: 'Street Food & Chaat', cuisine: 'all' },
  { id: 'gujarat', label: 'Gujarati Special', sub: 'Locho, Dhokla, Thepla, Handvo, Dal Dhokli', icon: '🥨', cat: 'Gujarati Special', cuisine: 'all' },
  { id: 'south_indian', label: 'South Indian', sub: 'Butter Masala Dosa, Idli, Vada, Filter Coffee', icon: '🫓', cat: 'South Indian', cuisine: 'all' },
  { id: 'north_indian', label: 'North Indian & Meals', sub: 'Chole Bhature, Paneer Butter, Dal Makhani', icon: '🍛', cat: 'North Indian & Meals', cuisine: 'all' },
  { id: 'chinese', label: 'Pan-Asian & Chinese', sub: 'Hakka Noodles, Schezwan Rice, Momos, Sushi', icon: '🍜', cat: 'Pan-Asian & Chinese', cuisine: 'all' },
  { id: 'fast_food', label: 'Fast Food, Pizza & Pasta', sub: 'Margherita, Alfredo, Peri Peri Fries, Nachos', icon: '🍕', cat: 'Fast Food, Pizza & Pasta', cuisine: 'all' },
  { id: 'beverages', label: 'Beverages & Chai', sub: 'Cutting Chai, Cold Coffee, Oreo Shake, Lassi', icon: '☕', cat: 'Beverages & Chai', cuisine: 'all' },
  { id: 'juices', label: 'Fresh Juices & Coolers', sub: 'Sugarcane, Mango Shake, Watermelon, Mosambi', icon: '🥤', cat: 'Fresh Juices & Coolers', cuisine: 'all' },
  { id: 'desserts', label: 'Desserts & Ice Cream', sub: 'Sizzling Brownie, Waffle, Kulfi, Lava Cake', icon: '🍨', cat: 'Desserts & Ice Cream', cuisine: 'all' },
  { id: 'snacks', label: 'Grab & Go Snacks', sub: 'Doritos, Potato Wafers, Cadbury, Protein Bars', icon: '🍫', cat: 'Grab & Go Snacks', cuisine: 'all' }
];


export default function CategoryDropdown({
  selectedCategory,
  setSelectedCategory,
  selectedCuisine,
  setSelectedCuisine,
  onReset
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current active option
  const activeOption = CATEGORY_OPTIONS.find(opt => {
    if (opt.id === 'all') return false;
    if (opt.cuisine && opt.cuisine !== 'all' && selectedCuisine.toLowerCase() === opt.cuisine.toLowerCase()) return true;
    if (opt.cat && opt.cat !== 'All' && selectedCategory.toLowerCase() === opt.cat.toLowerCase()) return true;
    return false;
  }) || CATEGORY_OPTIONS[0];

  const handleSelect = (opt) => {
    if (opt.id === 'all') {
      setSelectedCategory('All');
      setSelectedCuisine('all');
    } else {
      setSelectedCategory(opt.cat);
      setSelectedCuisine(opt.cuisine);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedCategory('All');
    setSelectedCuisine('all');
    if (onReset) onReset();
  };

  const isFiltered = activeOption.id !== 'all';

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-20'}`} ref={dropdownRef}>
      {/* The Single Unified Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border text-xs font-bold transition shadow-sm ${
          isFiltered
            ? 'bg-violet-600 text-white border-violet-600 ring-2 ring-violet-300'
            : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="text-sm">{activeOption.icon}</span>
        <span>
          {isFiltered ? `Category: ${activeOption.label}` : 'All Food Categories'}
        </span>
        
        {isFiltered ? (
          <span 
            onClick={handleClear}
            className="p-0.5 hover:bg-violet-700 rounded-full ml-1"
            title="Clear category filter"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Single Unified Dropdown Menu */}
      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-72 sm:w-80 max-w-[92vw] rounded-3xl shadow-2xl bg-white border border-gray-100 ring-1 ring-black/10 z-[100] p-2 animate-scaleUp">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
              Select Food Category
            </span>
            {isFiltered && (
              <button
                onClick={handleClear}
                className="text-[11px] text-rose-600 hover:underline font-bold"
              >
                Reset to All
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-1 space-y-1">
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = activeOption.id === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition text-left ${
                    isSelected
                      ? 'bg-violet-50 text-violet-900 border border-violet-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <span className="text-xl flex-shrink-0">{opt.icon}</span>
                    <div className="truncate">
                      <span className="block text-xs font-bold text-gray-900 truncate">
                        {opt.label}
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate">
                        {opt.sub}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-violet-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
