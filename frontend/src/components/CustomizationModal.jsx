import React, { useState } from 'react';
import { X, Plus, Check, Sparkles, ChefHat, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function CustomizationModal({ item, isOpen, onClose }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedCustoms, setSelectedCustoms] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [spiceLevel, setSpiceLevel] = useState('Medium');

  if (!isOpen || !item) return null;

  // Enhance pav bhaji & item default options if standard
  let availableCustoms = item.custom_options || [];
  if (item.name.toLowerCase().includes('pav bhaji')) {
    availableCustoms = [
      { name: "Extra Pav Jodi (2 pcs)", price: 20 },
      { name: "Double Extra Pav (4 pcs)", price: 35 },
      { name: "Extra Amul Butter Cube", price: 20 },
      { name: "Grated Amul Cheese Blast", price: 30 },
      { name: "Extra Onion & Fresh Lemon Bowl", price: 10 }
    ];
  } else if (item.name.toLowerCase().includes('dosa')) {
    availableCustoms = [
      { name: "Extra Pure Desi Ghee Roast", price: 25 },
      { name: "Grated Amul Cheese", price: 30 },
      { name: "Extra Sambhar Bowl", price: 15 },
      { name: "Spicy Gunpowder (Podi)", price: 15 }
    ];
  } else if (item.name.toLowerCase().includes('chai') || item.name.toLowerCase().includes('coffee')) {
    availableCustoms = [
      { name: "Kadak (Extra Decoction / Strong)", price: 0 },
      { name: "Sugar Free (Sugarless)", price: 0 },
      { name: "Extra Malai Float", price: 10 }
    ];
  }

  const toggleCustom = (custom) => {
    if (selectedCustoms.some(c => c.name === custom.name)) {
      setSelectedCustoms(selectedCustoms.filter(c => c.name !== custom.name));
    } else {
      setSelectedCustoms([...selectedCustoms, custom]);
    }
  };

  const extraCost = selectedCustoms.reduce((sum, c) => sum + (c.price || 0), 0);
  const finalPrice = item.price + extraCost;

  const handleConfirm = () => {
    const customList = [...selectedCustoms];
    if (spiceLevel !== 'Medium') {
      customList.push({ name: `Spice: ${spiceLevel}`, price: 0 });
    }
    if (specialInstructions.trim()) {
      customList.push({ name: `Note: ${specialInstructions.trim()}`, price: 0 });
    }

    addToCart(item, customList);
    if (showToast) showToast(`Added "${item.name}" (Customized) to cart! 🛒`, 'success', 2500);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image & Header */}
        <div className="relative h-40 w-full bg-gray-900 flex-shrink-0">
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-gray-950">
                {item.category}
              </span>
              {item.is_jain ? (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                  🌿 100% Jain
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                  Pure Veg
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-heading leading-tight drop-shadow-md">
              Customize {item.name}
            </h3>
          </div>
        </div>

        {/* Scrollable Customization Items */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Add-ons List */}
          <div>
            <span className="font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
              Add-ons & Extras
            </span>
            
            <div className="space-y-2">
              {availableCustoms.map((custom, idx) => {
                const isChecked = selectedCustoms.some(c => c.name === custom.name);
                return (
                  <label 
                    key={idx}
                    onClick={() => toggleCustom(custom)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-violet-600 bg-violet-50/70 shadow-sm ring-1 ring-violet-500' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                        isChecked ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-semibold text-gray-800 text-xs">
                        {custom.name}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-gray-900">
                      {custom.price === 0 ? 'FREE' : `+₹${custom.price}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Spice Level Preference */}
          <div>
            <span className="font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center">
              <Flame className="w-3.5 h-3.5 text-rose-500 mr-1" />
              Spice Level
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['Mild', 'Medium', 'Extra Tikhat 🔥'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSpiceLevel(lvl)}
                  className={`p-2 rounded-xl font-bold border transition text-center ${
                    spiceLevel === lvl
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-400'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Kitchen Instructions */}
          <div>
            <label className="font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center">
              <ChefHat className="w-3.5 h-3.5 text-violet-600 mr-1" />
              Kitchen Cooking Note
            </label>
            <input 
              type="text"
              placeholder="e.g. Toast pav extra crisp, less oil, cut into pieces..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-600"
            />
          </div>

        </div>

        {/* Sticky Modal Bottom Action */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Item Total</span>
            <span className="text-xl font-black text-gray-900 font-heading">₹{finalPrice}</span>
          </div>

          <button
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-violet-200 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item (₹{finalPrice})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
