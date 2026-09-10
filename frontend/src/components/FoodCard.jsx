import React, { useState } from 'react';
import { Star, Plus, Minus, MapPin, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CustomizationModal from './CustomizationModal';
import { getFoodImage } from '../utils/foodImages';

export default function FoodCard({ item }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const { showToast } = useToast();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.image_url || getFoodImage(item.name, item.category));

  // Check if item is already in cart
  const cartEntries = cart.filter(i => i.id === item.id);
  const totalQtyInCart = cartEntries.reduce((sum, i) => sum + i.qty, 0);
  const cartEntry = cartEntries[0];
  const qtyInCart = totalQtyInCart;

  const hasCustomizations = (item.custom_options && item.custom_options.length > 0) || 
                            item.name.toLowerCase().includes('pav bhaji') ||
                            item.name.toLowerCase().includes('dosa') ||
                            item.name.toLowerCase().includes('chai');

  const handleAddClick = () => {
    if (hasCustomizations) {
      setShowCustomModal(true);
    } else {
      addToCart(item, []);
      if (showToast) showToast(`Added "${item.name}" to cart! 🛒`, 'success', 2500);
    }
  };

  const handleImageError = () => {
    setImgSrc(getFoodImage(item.name, item.category));
  };

  const isOutOfStock = item.stock_status === 'out_of_stock';
  const isLowStock = item.stock_status === 'low_quantity';

  return (
    <>
      <div className={`group bg-white rounded-3xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[390px] ${
        isOutOfStock ? 'opacity-75' : ''
      }`}>
        
        {/* Card Top Section */}
        <div>
          {/* Image Container with Safe Overlay Badges (Zero text collision) */}
          <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-gray-100 mb-3 select-none flex-shrink-0">
            <img 
              src={imgSrc} 
              alt={item.name} 
              loading="lazy"
              onError={handleImageError}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                isOutOfStock ? 'grayscale' : 'group-hover:scale-105'
              }`}
            />
            
            {/* Top Badges Strip (Strictly inside the image overlay) */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
              {/* Veg Indicator: Official clean Indian Veg Symbol */}
              <div className="w-4 h-4 bg-white/95 rounded-md flex items-center justify-center border border-emerald-600 shadow-sm flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              </div>

              {/* Regional Cuisine Tag or Low Stock alert */}
              <div className="flex items-center space-x-1">
                {isLowStock && (
                  <span className="bg-amber-500 text-gray-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    Few Left!
                  </span>
                )}
                {item.state_cuisine && (
                  <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm truncate max-w-[120px]">
                    {item.state_cuisine}
                  </span>
                )}
              </div>
            </div>

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
                <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider shadow-md">
                  Sold Out
                </span>
              </div>
            )}

            {/* Canteen Floor Pill (Bottom overlay) */}
            <div className="absolute bottom-2 left-2.5 bg-black/65 backdrop-blur-md text-white/90 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 pointer-events-none z-10">
              <MapPin className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
              <span>
                {item.canteen_ids?.includes('ground') ? 'Ground' : ''}
                {item.canteen_ids?.includes('6th_floor') ? ' • 6th' : ''}
                {item.canteen_ids?.includes('8th_floor') ? ' • 8th' : ''} Flr
              </span>
            </div>
          </div>

          {/* Details Section with Normalized Heights */}
          <div className="space-y-1">
            {/* Category & Rating Row (Fixed height: h-5) */}
            <div className="flex items-center justify-between text-xs h-5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate mr-2">
                {item.category}
              </span>
              <div className="flex items-center space-x-1 text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-bold flex-shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.rating || 4.8}</span>
                <span className="text-gray-400 font-normal">({item.reviews_count || 120})</span>
              </div>
            </div>

            {/* Dish Title (Normalized fixed height: h-11, clean 2-line clamp with tooltip) */}
            <div className="h-11 flex items-center">
              <h3 
                title={item.name}
                className="font-heading font-bold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-violet-700 transition line-clamp-2"
              >
                {item.name}
              </h3>
            </div>

            {/* Description (Normalized fixed height: h-8, clean 2-line clamp) */}
            <div className="h-8">
              <p 
                title={item.desc}
                className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed"
              >
                {item.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Price & Action Button (Pinned uniformly to card bottom) */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold leading-none">Price</span>
            <span className="text-lg font-black text-gray-950 font-heading">
              ₹{item.price}
            </span>
          </div>

          <div className="text-right">
            {isOutOfStock ? (
              <span className="inline-block px-4 py-2 rounded-2xl bg-gray-100 text-gray-400 font-bold text-xs border border-gray-200 cursor-not-allowed select-none">
                Sold Out
              </span>
            ) : qtyInCart > 0 && !hasCustomizations ? (
              /* Inline Quantity Stepper */
              <div className="flex items-center bg-violet-50 border border-violet-200 rounded-2xl p-0.5">
                <button
                  onClick={() => updateQuantity(cartEntry.cartKey, -1)}
                  className="w-7 h-7 rounded-xl bg-white hover:bg-violet-100 text-violet-700 font-bold flex items-center justify-center transition shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center font-black text-xs text-violet-900">
                  {qtyInCart}
                </span>
                <button
                  onClick={() => updateQuantity(cartEntry.cartKey, 1)}
                  className="w-7 h-7 rounded-xl bg-white hover:bg-violet-100 text-violet-700 font-bold flex items-center justify-center transition shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* Add Button */
              <div>
                <button
                  onClick={handleAddClick}
                  className={`font-extrabold text-xs px-4 py-2 rounded-2xl transition shadow-sm active:scale-95 flex items-center space-x-1.5 ${
                    totalQtyInCart > 0 
                      ? 'bg-emerald-600 text-white shadow-emerald-200 border border-emerald-600 hover:bg-emerald-700' 
                      : 'bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white border border-violet-200 hover:border-violet-600'
                  }`}
                >
                  <span>{totalQtyInCart > 0 ? `ADD MORE (${totalQtyInCart})` : 'ADD'}</span>
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
                {hasCustomizations && (
                  <span className="block text-[9px] font-bold text-gray-400 mt-0.5 text-center">
                    {totalQtyInCart > 0 ? 'Customized in cart' : 'Customisable'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal for item customizations */}
      {hasCustomizations && (
        <CustomizationModal
          item={item}
          isOpen={showCustomModal}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </>
  );
}
