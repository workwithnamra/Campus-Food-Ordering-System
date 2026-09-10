import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Plus, 
  Check, 
  AlertCircle, 
  Building2, 
  Clock, 
  ChevronDown, 
  Flame, 
  Leaf, 
  Eye 
} from 'lucide-react';
import { getFoodImage } from '../utils/foodImages';

const FLOORS = [
  { id: 'ground', label: 'Ground', code: 'G', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: '6th_floor', label: '6th Flr', code: '6th', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: '8th_floor', label: '8th Flr', code: '8th', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
];

export default function AdminInventoryTable({ 
  menu, 
  onEditDish, 
  onDeleteDish, 
  onQuickToggleStock, 
  onQuickToggleFloor, 
  onOpenAddModal 
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Extract unique categories from menu
  const categories = ['all', ...new Set(menu.map(i => i.category || 'Other'))];

  // Filtering
  const filteredMenu = menu.filter(item => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchDesc = item.desc?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchDesc) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Floor filter
    if (selectedFloor !== 'all') {
      const floors = item.canteen_ids || ['ground', '6th_floor', '8th_floor'];
      if (!floors.includes(selectedFloor)) return false;
    }

    // Stock status filter
    if (selectedStock !== 'all') {
      const status = item.stock_status || 'in_stock';
      if (status !== selectedStock) return false;
    }

    return true;
  });

  const getStockBadge = (status) => {
    switch (status) {
      case 'out_of_stock':
        return { label: 'Sold Out', bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', dot: 'bg-rose-500' };
      case 'low_quantity':
        return { label: 'Low Stock', bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100', dot: 'bg-amber-500' };
      case 'in_stock':
      default:
        return { label: 'In Stock', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100', dot: 'bg-emerald-500' };
    }
  };

  const cycleStock = (currentStatus) => {
    if (!currentStatus || currentStatus === 'in_stock') return 'low_quantity';
    if (currentStatus === 'low_quantity') return 'out_of_stock';
    return 'in_stock';
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Multi-Filter Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search dish name, category, or cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:border-violet-600 transition font-medium"
          />
        </div>

        {/* Center: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-violet-600 cursor-pointer"
          >
            <option value="all">All Categories ({categories.length - 1})</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Floor Filter */}
          <select
            value={selectedFloor}
            onChange={e => setSelectedFloor(e.target.value)}
            className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-violet-600 cursor-pointer"
          >
            <option value="all">All 3 Floors</option>
            <option value="ground">Ground Floor</option>
            <option value="6th_floor">6th Floor (Jain)</option>
            <option value="8th_floor">8th Floor (Sky)</option>
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStock}
            onChange={e => setSelectedStock(e.target.value)}
            className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-violet-600 cursor-pointer"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock Only</option>
            <option value="low_quantity">Low Stock Only</option>
            <option value="out_of_stock">Sold Out Only</option>
          </select>

          {/* Reset Filters */}
          {(search || selectedCategory !== 'all' || selectedFloor !== 'all' || selectedStock !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedFloor('all');
                setSelectedStock('all');
              }}
              className="text-xs text-rose-600 hover:underline font-bold px-1"
            >
              Reset
            </button>
          )}

        </div>

        {/* Right: Primary Add Dish Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-sm transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>

      </div>

      {/* Results Summary Strip */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-2">
        <span>
          Showing <strong className="text-gray-900">{filteredMenu.length}</strong> of <strong className="text-gray-900">{menu.length}</strong> total dishes
        </span>
        <span className="text-[11px] text-gray-400">
          💡 Click stock status or floor tags to toggle instantly
        </span>
      </div>

      {/* Clean Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-3 px-4">Dish Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Status (Quick Toggle)</th>
                <th className="py-3 px-4">Floor Availability</th>
                <th className="py-3 px-4 text-center">Prep</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-600">No dishes found matching your filters</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing search or filters above</p>
                  </td>
                </tr>
              ) : (
                filteredMenu.map(item => {
                  const stock = getStockBadge(item.stock_status);
                  const currentFloors = item.canteen_ids || ['ground', '6th_floor', '8th_floor'];
                  const isDeleting = deleteConfirmId === item.id;
                  const thumb = item.image_url || getFoodImage(item.name, item.category);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      
                      {/* 1. Dish Details (Thumbnail + Name + Badges) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3 min-w-[200px]">
                          <img
                            src={thumb}
                            alt={item.name}
                            onError={e => { e.target.src = getFoodImage(item.name, item.category); }}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block text-xs truncate group-hover:text-violet-700 transition">
                              {item.name}
                            </span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {item.is_jain && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded">
                                  JAIN
                                </span>
                              )}
                              {item.state_cuisine && (
                                <span className="text-[9px] text-gray-400 font-semibold truncate">
                                  {item.state_cuisine}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          {item.category}
                        </span>
                      </td>

                      {/* 3. Price */}
                      <td className="py-3 px-4">
                        <span className="font-heading font-black text-gray-950 text-sm">
                          ₹{item.price}
                        </span>
                      </td>

                      {/* 4. Stock Status Quick-Toggle Button */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onQuickToggleStock(item.id, cycleStock(item.stock_status))}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black transition cursor-pointer shadow-2xs ${stock.bg}`}
                          title="Click to cycle status: In Stock ➔ Low Stock ➔ Sold Out"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stock.dot}`}></span>
                          <span>{stock.label}</span>
                        </button>
                      </td>

                      {/* 5. Floor Availability Checkbox Pills */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {FLOORS.map(fl => {
                            const isAvailable = currentFloors.includes(fl.id);
                            return (
                              <button
                                key={fl.id}
                                type="button"
                                onClick={() => onQuickToggleFloor(item.id, fl.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition cursor-pointer ${
                                  isAvailable
                                    ? fl.color
                                    : 'bg-gray-100/70 border-gray-200 text-gray-400 line-through hover:bg-gray-200'
                                }`}
                                title={`${fl.label}: Click to ${isAvailable ? 'disable' : 'enable'}`}
                              >
                                {fl.code}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Prep Time */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] text-gray-500 font-bold">
                          ~{item.prep_time || 10}m
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-right">
                        {isDeleting ? (
                          <div className="inline-flex items-center space-x-1 bg-rose-50 border border-rose-200 p-1 rounded-xl">
                            <span className="text-[10px] text-rose-800 font-bold pl-1">Delete?</span>
                            <button
                              onClick={() => {
                                onDeleteDish(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-[10px] font-bold"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onEditDish(item)}
                              className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition"
                              title="Edit dish details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Delete dish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
