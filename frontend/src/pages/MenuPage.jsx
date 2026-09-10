import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Leaf, Sparkles, ShoppingBag, ArrowRight, X, AlertCircle, Bot, Zap, Dumbbell } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FilterModal from '../components/FilterModal';
import AIAssistantModal from '../components/AIAssistantModal';
import CategoryDropdown from '../components/CategoryDropdown';
import CampusQueueRadar from '../components/CampusQueueRadar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function MenuPage({ jainOnly, selectedCanteen, setSelectedCanteen }) {
  const { user } = useAuth();
  const { cart, grandTotal, totalItemCount } = useCart();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cuisine, setCuisine] = useState('all');
  const [maxPrice, setMaxPrice] = useState(350);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(24);
  const [floorOnly, setFloorOnly] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null); // 'under100' | 'fast' | 'protein'

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCanteen && selectedCanteen !== 'all') params.append('canteen', selectedCanteen);
      if (jainOnly) params.append('jainOnly', 'true');
      if (category && category !== 'All') params.append('category', category);
      if (cuisine && cuisine !== 'all') params.append('cuisine', cuisine);
      if (search) params.append('search', search);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`http://localhost:5000/api/menu?${params.toString()}`);
      const data = await res.json();
      let fetchedItems = data.items || [];

      // Floor-Smart filter: "Available on my floor right now"
      if (floorOnly && selectedCanteen && selectedCanteen !== 'all') {
        fetchedItems = fetchedItems.filter(i => i.canteen_ids && i.canteen_ids.includes(selectedCanteen));
      }

      // Quick filter adjustments
      if (activeQuickFilter === 'fast') {
        fetchedItems = fetchedItems.filter(i => i.price <= 80 && (i.category === 'Snacks' || i.category === 'Beverages'));
      } else if (activeQuickFilter === 'protein') {
        fetchedItems = fetchedItems.filter(i => i.category === 'Protein Bars' || i.name.toLowerCase().includes('protein') || i.name.toLowerCase().includes('paneer'));
      }

      setItems(fetchedItems);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    setDisplayCount(24);

    const onFocus = () => fetchMenu();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(fetchMenu, 12000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [selectedCanteen, jainOnly, category, cuisine, maxPrice, sortBy, search, floorOnly, activeQuickFilter]);

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setCuisine('all');
    setMaxPrice(350);
    setSortBy('popular');
    setActiveQuickFilter(null);
    setFloorOnly(false);
  };

  const handleQuickFilter = (type) => {
    if (activeQuickFilter === type) {
      setActiveQuickFilter(null);
      if (type === 'under100') setMaxPrice(350);
    } else {
      setActiveQuickFilter(type);
      if (type === 'under100') setMaxPrice(100);
      else setMaxPrice(350);
    }
  };

  const isAnyFilterActive = category !== 'All' || cuisine !== 'all' || maxPrice < 350 || search !== '' || sortBy !== 'popular' || activeQuickFilter !== null || floorOnly;
  const visibleItems = items.slice(0, displayCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-12">
      
      {/* Friendly Header Bar with Consolidated Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-gray-900 tracking-tight">
            SVKM Cafeteria Menu
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {selectedCanteen === 'all' 
              ? 'Browse across Ground Floor, 6th Floor & 8th Floor' 
              : `Viewing dishes for ${selectedCanteen === 'ground' ? 'Ground Floor Plaza' : selectedCanteen === '6th_floor' ? '6th Floor Faculty Hub' : '8th Floor Sky Lounge'}`}
          </p>
        </div>

        {/* Clean Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search dishes (Pav Bhaji, Dosa, Dhokla)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600 shadow-sm font-medium"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Campus Queue Radar & Wait Times */}
      <CampusQueueRadar 
        selectedCanteen={selectedCanteen}
        setSelectedCanteen={setSelectedCanteen}
        floorOnly={floorOnly}
        setFloorOnly={setFloorOnly}
      />

      {/* Dedicated Jain Canteen Outlet Banner (Displayed when Jain is active) */}
      {jainOnly && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-4 sm:p-5 shadow-lg mb-5 animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-emerald-200 flex-shrink-0">
              <Leaf className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-sm uppercase tracking-wide">
                  SVKM Certified Jain Outlet
                </span>
                <span className="text-[10px] bg-white text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                  100% PURE JAIN
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Prepared in a dedicated kitchen without onion, garlic, potatoes, or root vegetables.
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-900/40 border border-white/20 px-3 py-1.5 rounded-2xl font-bold self-start sm:self-auto text-emerald-100">
            {items.length} Jain Dishes Available
          </span>
        </div>
      )}

      {/* Streamlined Controls Bar (One Single AI Entry Point + Unified Category Dropdown + High-Impact Chips) */}
      <div className="relative z-40 flex flex-wrap items-center gap-2 pb-2 pt-1 text-xs font-bold">
        
        {/* 1. Sort & Filters Dialog Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border flex-shrink-0 transition shadow-sm ${
            category !== 'All' || cuisine !== 'all' || maxPrice < 350 || sortBy !== 'popular'
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters & Sort</span>
          {(maxPrice < 350 || sortBy !== 'popular') && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        {/* 2. THE SINGLE UNIFIED CATEGORY OPTION (Housing all cuisines & types cleanly) */}
        <CategoryDropdown
          selectedCategory={category}
          setSelectedCategory={setCategory}
          selectedCuisine={cuisine}
          setSelectedCuisine={setCuisine}
          onReset={() => {
            setCategory('All');
            setCuisine('all');
          }}
        />

        {/* 3. Consolidated Single AI Entry Point */}
        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border flex-shrink-0 transition bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Ask AI Foodie</span>
        </button>

        {/* 4. High-Impact Quick Campus Filters */}
        <button
          onClick={() => {
            if (category === 'Combos & Value Meals') {
              setCategory('All');
            } else {
              setCategory('Combos & Value Meals');
              setCuisine('all');
            }
          }}
          className={`px-3.5 py-2 rounded-2xl border flex-shrink-0 transition shadow-sm flex items-center space-x-1.5 ${
            category === 'Combos & Value Meals'
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300 hover:bg-rose-100'
          }`}
        >
          <span>🍱 Combos & Value Meals</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            category === 'Combos & Value Meals' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'
          }`}>
            Save 25%
          </span>
        </button>

        <button
          onClick={() => handleQuickFilter('under100')}
          className={`px-3 py-2 rounded-2xl border flex-shrink-0 transition shadow-sm ${
            activeQuickFilter === 'under100'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span>💰 Under ₹100</span>
        </button>

        <button
          onClick={() => handleQuickFilter('fast')}
          className={`px-3 py-2 rounded-2xl border flex-shrink-0 transition shadow-sm flex items-center space-x-1 ${
            activeQuickFilter === 'fast'
              ? 'bg-amber-500 text-gray-950 border-amber-500'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Bites (&lt;5 mins)</span>
        </button>

        <button
          onClick={() => handleQuickFilter('protein')}
          className={`px-3 py-2 rounded-2xl border flex-shrink-0 transition shadow-sm flex items-center space-x-1 ${
            activeQuickFilter === 'protein'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>High Protein</span>
        </button>

        {/* Clear Filter Action */}
        {isAnyFilterActive && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:underline px-2 flex-shrink-0 font-bold"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold my-4">
        <span>
          Showing <strong className="text-gray-900">{items.length}</strong> appetizing dishes
          {floorOnly && selectedCanteen !== 'all' && (
            <span className="text-violet-700 ml-1.5 font-bold">• On Selected Floor Only</span>
          )}
        </span>
        <span className="text-gray-400 hidden sm:inline">
          Sorted by: <strong className="text-gray-700 capitalize">{sortBy.replace('_', ' ')}</strong>
        </span>
      </div>

      {/* Dishes Responsive Grid (Uniform Height, No Overlaps) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 animate-pulse space-y-3 h-[390px]">
              <div className="bg-gray-200 rounded-2xl h-44 w-full" />
              <div className="bg-gray-200 h-4 rounded w-3/4" />
              <div className="bg-gray-200 h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : visibleItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibleItems.map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load More Button */}
          {visibleItems.length < items.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setDisplayCount(prev => prev + 24)}
                className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition"
              >
                Load More Dishes ({items.length - visibleItems.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 mb-1">No matching dishes</h3>
          <p className="text-xs text-gray-400 mb-4">
            Try adjusting your search or clearing quick filters.
          </p>
          <button
            onClick={resetFilters}
            className="bg-violet-600 text-white text-xs font-bold px-5 py-2 rounded-xl"
          >
            Show All Dishes
          </button>
        </div>
      )}

      {/* Floating Bottom Cart Bar (Mobile & Desktop) */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-40 animate-slideUp">
          <Link
            to="/cart"
            className="w-full bg-gradient-to-r from-gray-950 via-violet-950 to-indigo-950 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between font-bold text-sm border-2 border-violet-500/40 hover:scale-[1.02] active:scale-98 transition-all backdrop-blur-md hover:shadow-violet-500/30"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-lg shadow-inner">
                🛒
              </div>
              <div>
                <span className="block text-[11px] uppercase font-black text-amber-300 tracking-wider">
                  {totalItemCount} {totalItemCount > 1 ? 'ITEMS' : 'ITEM'} IN CART
                </span>
                <span className="text-base font-black font-heading text-white">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-white text-gray-950 px-4 py-2 rounded-xl text-xs font-black shadow hover:bg-gray-100 transition">
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Floating AI Assistant Action on Mobile */}
      <button
        onClick={() => setShowAIModal(true)}
        className="sm:hidden fixed bottom-28 right-4 z-40 bg-gradient-to-tr from-violet-600 to-purple-600 text-white p-3.5 rounded-full shadow-2xl shadow-violet-500/40 hover:scale-110 active:scale-95 transition flex items-center justify-center border-2 border-white/30"
        title="Ask SVKM Foodie AI"
      >
        <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
      </button>

      {/* Filter & Sort Dialog */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={category}
        setSelectedCategory={setCategory}
        selectedCuisine={cuisine}
        setSelectedCuisine={setCuisine}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        resetFilters={resetFilters}
        totalResults={items.length}
      />

      {/* Supercharged AI Assistant Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        allMenuItems={items}
      />

    </div>
  );
}
