import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Tag, 
  Building2, 
  Flame, 
  Leaf, 
  RefreshCw 
} from 'lucide-react';
import { getFoodImage } from '../utils/foodImages';

const CATEGORIES = [
  'Street Food & Chaat',
  'Gujarati Special',
  'South Indian',
  'North Indian & Meals',
  'Pan-Asian & Chinese',
  'Fast Food, Pizza & Pasta',
  'Beverages & Chai',
  'Fresh Juices & Coolers',
  'Desserts & Ice Cream',
  'Grab & Go Snacks'
];


const AVAILABLE_BADGES = [
  { id: 'pure_veg', label: '100% Pure Veg', icon: '🟢' },
  { id: 'jain', label: 'Jain Available', icon: '🌿' },
  { id: 'spicy', label: 'Spicy / Tikhat', icon: '🔥' },
  { id: 'high_protein', label: 'High Protein', icon: '💪' },
  { id: 'gujarat', label: 'Gujarat Specialty', icon: '🥨' },
  { id: 'maharashtra', label: 'Mumbai Street', icon: '🥪' },
  { id: 'south_india', label: 'South Indian', icon: '🫓' },
  { id: 'quick_bite', label: 'Quick Bite (<5m)', icon: '⚡' },
];

const CANTEEN_FLOORS = [
  { id: 'ground', label: 'Ground Floor Plaza', short: 'Ground' },
  { id: '6th_floor', label: '6th Floor (Jain & Faculty Hub)', short: '6th Floor' },
  { id: '8th_floor', label: '8th Floor Sky Lounge', short: '8th Floor' },
];

const PRESET_IMAGES = [
  { label: 'Pav Bhaji', url: '/images/food/pav-bhaji.jpg' },
  { label: 'Vada Pav', url: '/images/food/vada-pav.jpg' },
  { label: 'Masala Dosa', url: '/images/food/dosa.jpg' },
  { label: 'Khaman Dhokla', url: '/images/food/dhokla.jpg' },
  { label: 'Paneer Butter', url: '/images/food/paneer-butter-masala.jpg' },
  { label: 'Hakka Noodles', url: '/images/food/noodles.jpg' },
  { label: 'Elaichi Chai', url: '/images/food/chai.jpg' },
  { label: 'Strawberry Juice', url: '/images/food/strawberry-juice.jpg' },
  { label: 'Mango Shake', url: '/images/food/mango-shake.jpg' },
  { label: 'Sizzling Brownie', url: '/images/food/brownie.jpg' },
  { label: 'French Fries', url: '/images/food/french-fries.jpg' },
  { label: 'Margherita Pizza', url: '/images/food/margherita-pizza.jpg' },
  { label: 'Samosa Plate', url: '/images/food/samosa.jpg' },
];


export default function DishFormModal({ isOpen, onClose, initialData, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [price, setPrice] = useState('');
  const [prepTime, setPrepTime] = useState(10);
  const [desc, setDesc] = useState('');
  const [stockStatus, setStockStatus] = useState('in_stock'); // 'in_stock' | 'low_quantity' | 'out_of_stock'
  const [dietaryBadges, setDietaryBadges] = useState(['100% Pure Veg']);
  const [canteenIds, setCanteenIds] = useState(['ground', '6th_floor', '8th_floor']);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url' | 'presets'

  const fileInputRef = useRef(null);

  // Initialize or reset form when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || 'Snacks');
      setPrice(initialData.price !== undefined ? initialData.price.toString() : '');
      setPrepTime(initialData.prep_time || 10);
      setDesc(initialData.desc || '');
      setStockStatus(initialData.stock_status || 'in_stock');
      setDietaryBadges(
        initialData.dietary_badges && initialData.dietary_badges.length > 0
          ? initialData.dietary_badges
          : [
              ...(initialData.is_jain ? ['Jain Available'] : []),
              '100% Pure Veg',
              ...(initialData.state_cuisine ? [initialData.state_cuisine] : [])
            ]
      );
      setCanteenIds(initialData.canteen_ids && initialData.canteen_ids.length ? initialData.canteen_ids : ['ground', '6th_floor', '8th_floor']);
      setImageUrl(initialData.image_url || '');
    } else {
      setName('');
      setCategory('Snacks');
      setPrice('');
      setPrepTime(10);
      setDesc('');
      setStockStatus('in_stock');
      setDietaryBadges(['100% Pure Veg']);
      setCanteenIds(['ground', '6th_floor', '8th_floor']);
      setImageUrl('');
    }
    setValidationError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData?.id);

  // Toggle badge checkbox
  const toggleBadge = (badgeLabel) => {
    setDietaryBadges(prev => 
      prev.includes(badgeLabel)
        ? prev.filter(b => b !== badgeLabel)
        : [...prev, badgeLabel]
    );
  };

  // Toggle floor checkbox
  const toggleFloor = (floorId) => {
    setCanteenIds(prev => {
      if (prev.includes(floorId)) {
        if (prev.length === 1) return prev; // keep at least one floor
        return prev.filter(f => f !== floorId);
      }
      return [...prev, floorId];
    });
  };

  // Handle local file read
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
      setValidationError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Dish name is required.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setValidationError('Please enter a valid price greater than ₹0.');
      return;
    }

    if (canteenIds.length === 0) {
      setValidationError('Please select at least one canteen floor for availability.');
      return;
    }

    const effectiveImageUrl = imageUrl.trim() || getFoodImage(trimmedName, category);

    const payload = {
      name: trimmedName,
      category,
      price: numPrice,
      prep_time: Number(prepTime) || 10,
      desc: desc.trim() || `${trimmedName} freshly prepared at SVKM Cafeteria.`,
      stock_status: stockStatus,
      dietary_badges: dietaryBadges,
      is_jain: dietaryBadges.includes('Jain Available'),
      canteen_ids: canteenIds,
      image_url: effectiveImageUrl
    };

    setIsSubmitting(true);
    try {
      await onSave(payload, initialData?.id);
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to save dish. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculated preview image
  const previewImg = imageUrl.trim() || getFoodImage(name.trim() || 'Dish', category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div>
            <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight flex items-center space-x-2">
              <span>{isEdit ? 'Edit Cafeteria Dish' : 'Add New Cafeteria Dish'}</span>
              {isEdit && (
                <span className="text-xs bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full">
                  ID: #{initialData.id}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Configure dish details, floor availability, pricing, and live image asset.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-2xl hover:bg-gray-200/60 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Main Dish Attributes (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Dish Name */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                  Dish Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Classic Amul Butter Pav Bhaji"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-violet-600 transition"
                  required
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-violet-600 transition cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                    Price in ₹ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="90"
                      min="1"
                      step="1"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-violet-600 transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Prep Time & Stock Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-violet-600" />
                    <span>Estimated Prep Time (mins)</span>
                  </label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={e => setPrepTime(e.target.value)}
                    placeholder="10"
                    min="1"
                    max="60"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-violet-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                    Inventory Stock Status
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setStockStatus('in_stock')}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition ${
                        stockStatus === 'in_stock'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      In Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockStatus('low_quantity')}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition ${
                        stockStatus === 'low_quantity'
                          ? 'bg-amber-500 text-gray-950 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Low Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockStatus('out_of_stock')}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition ${
                        stockStatus === 'out_of_stock'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Sold Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Floor Availability Multi-Select */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5 flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-violet-600" />
                  <span>Floor Availability (Multi-Select) <span className="text-rose-500">*</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CANTEEN_FLOORS.map(floor => {
                    const isSelected = canteenIds.includes(floor.id);
                    return (
                      <button
                        key={floor.id}
                        type="button"
                        onClick={() => toggleFloor(floor.id)}
                        className={`p-2.5 rounded-2xl border text-left font-bold transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-violet-50 border-violet-400 text-violet-950 ring-1 ring-violet-300'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs">{floor.short}</span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black ${
                          isSelected ? 'bg-violet-600 text-white' : 'border border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Badges */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-violet-600" />
                  <span>Dietary & Cuisine Badges</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_BADGES.map(badge => {
                    const isChecked = dietaryBadges.includes(badge.label);
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => toggleBadge(badge.label)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                        {isChecked && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                  Description & Kitchen Details
                </label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Provide appetizing culinary details, served items, and spice profile..."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-violet-600 transition resize-none"
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Image Uploader & Live Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                    <span>Food Imagery</span>
                  </span>

                  {/* Mode switcher tabs */}
                  <div className="flex bg-gray-200/80 p-0.5 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2 py-1 rounded-lg transition ${
                        imageTab === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2 py-1 rounded-lg transition ${
                        imageTab === 'url' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('presets')}
                      className={`px-2 py-1 rounded-lg transition ${
                        imageTab === 'presets' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Presets
                    </button>
                  </div>
                </div>

                {/* Tab 1: Drag & Drop File Upload */}
                {imageTab === 'upload' && (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={e => e.target.files && handleFile(e.target.files[0])}
                      className="hidden" 
                    />
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 ${
                        isDragOver 
                          ? 'border-violet-600 bg-violet-50/70' 
                          : 'border-gray-300 hover:border-violet-400 bg-white'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Drag photo here or <strong className="text-violet-600 underline">browse</strong>
                      </span>
                      <span className="text-[10px] text-gray-400">
                        PNG, JPG, WebP supported
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Direct Image URL Input */}
                {imageTab === 'url' && (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="Paste image web URL (https://...)"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-violet-600"
                    />
                    <span className="text-[10px] text-gray-400 block">
                      Direct Unsplash, CDN, or web photo links.
                    </span>
                  </div>
                )}

                {/* Tab 3: Quick College Presets */}
                {imageTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-left text-[11px] font-bold flex items-center space-x-2 transition ${
                          imageUrl === preset.url
                            ? 'bg-violet-100 border-violet-500 text-violet-900'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Preview Card Thumbnail */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                      Live Customer Preview
                    </span>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>

                  {/* Mock Mini Food Card */}
                  <div className="bg-white rounded-2xl p-2.5 border border-gray-200 shadow-xs space-y-2">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={previewImg}
                        alt="Preview"
                        onError={e => {
                          e.target.src = getFoodImage(name || 'Dish', category);
                        }}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Dietary dot & status tag */}
                      <div className="absolute top-2 left-2 flex items-center space-x-1">
                        <div className="w-3.5 h-3.5 bg-white/95 rounded-sm flex items-center justify-center border border-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </div>
                        {dietaryBadges.includes('Jain Available') && (
                          <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                            JAIN
                          </span>
                        )}
                      </div>

                      {stockStatus === 'out_of_stock' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <span className="font-bold text-gray-900 block text-xs truncate">
                          {name.trim() || 'Sample Dish Name'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold block">
                          {category} • ~{prepTime}m
                        </span>
                      </div>
                      <span className="font-black text-sm text-gray-950 ml-2">
                        ₹{price || '0'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black shadow-lg shadow-violet-200 transition flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Menu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? 'Update Dish' : 'Create & Publish Dish'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
