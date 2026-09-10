import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Utensils, 
  ShoppingCart, 
  Award, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Leaf, 
  Home,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar({ jainOnly, setJainOnly, selectedCanteen, setSelectedCanteen }) {
  const { user, logout, isAdmin } = useAuth();
  const { totalItemCount } = useCart();
  const location = useLocation();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
            
            {/* Left: Brand + Canteen Location Selector */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-200">
                  <Utensils className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="font-heading font-black text-xl tracking-tight text-gray-950">
                    SVKM <span className="text-amber-500">Canteen</span>
                  </span>
                </div>
              </Link>

              {/* Clean Canteen Floor Selector Pill */}
              <div className="flex items-center bg-gray-100/80 hover:bg-gray-200/80 px-3 py-1.5 rounded-2xl transition cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-violet-600 mr-1.5 flex-shrink-0" />
                <select
                  value={selectedCanteen}
                  onChange={(e) => setSelectedCanteen(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">All 3 Floors</option>
                  <option value="ground">Ground Floor</option>
                  <option value="6th_floor">6th Floor (Jain)</option>
                  <option value="8th_floor">8th Floor (Sky Lounge)</option>
                </select>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Jain Toggle Chip */}
              <button
                onClick={() => setJainOnly(!jainOnly)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl font-bold text-xs border transition shadow-sm ${
                  jainOnly 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 ring-2 ring-emerald-400/40' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Toggle strictly Jain dishes"
              >
                <Leaf className={`w-3.5 h-3.5 ${jainOnly ? 'fill-white text-white' : 'text-emerald-600'}`} />
                <span>Jain</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full uppercase font-black ${
                  jainOnly ? 'bg-white text-emerald-700' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {jainOnly ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center space-x-1 font-bold text-xs text-gray-600">
                <Link 
                  to="/orders" 
                  className={`px-3 py-2 rounded-xl transition ${
                    location.pathname === '/orders' ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-100'
                  }`}
                >
                  My Orders
                </Link>
                <Link 
                  to="/loyalty" 
                  className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
                    location.pathname === '/loyalty' 
                      ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300' 
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80'
                  }`}
                  title="SVKM Loyalty Rewards & Coins"
                >
                  <span className="text-amber-500 font-black text-xs">🪙</span>
                  <span className="font-extrabold">{user?.svkm_coins || 0}</span>
                  <span className="text-[11px] text-amber-800 font-semibold hidden lg:inline">Coins</span>
                  {user && (
                    <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {user.loyalty_count || 0}/5
                    </span>
                  )}
                </Link>

                {/* Admin Panel button strictly visible only for Admin login */}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                      location.pathname === '/admin'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Cafeteria Admin Dashboard"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${location.pathname === '/admin' ? 'text-amber-300' : 'text-amber-600'}`} />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </nav>

              {/* Desktop Cart Button */}
              <Link 
                to="/cart" 
                className="relative hidden sm:flex items-center space-x-1.5 bg-gray-900 hover:bg-black text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {totalItemCount > 0 && (
                  <span className="bg-amber-400 text-gray-950 text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {totalItemCount}
                  </span>
                )}
              </Link>

              {/* User Avatar */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-800 font-black text-xs flex items-center justify-center border border-violet-200">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <button 
                    onClick={logout}
                    className="hidden sm:inline text-xs text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
                >
                  Login
                </Link>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar (Zomato / Swiggy style) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2 px-6 flex justify-between items-center shadow-lg">
        <Link 
          to="/" 
          className={`flex flex-col items-center text-[10px] font-bold ${
            location.pathname === '/' || location.pathname === '/menu' ? 'text-violet-600' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </Link>

        <Link 
          to="/orders" 
          className={`flex flex-col items-center text-[10px] font-bold ${
            location.pathname === '/orders' ? 'text-violet-600' : 'text-gray-400'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </Link>

        <Link 
          to="/loyalty" 
          className={`flex flex-col items-center text-[10px] font-bold relative ${
            location.pathname === '/loyalty' ? 'text-violet-600' : 'text-gray-400'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5 text-amber-500" />
          <span>🪙 {user?.svkm_coins || 0}</span>
          {user && (
            <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-extrabold px-1 rounded-full">
              {user.loyalty_count || 0}/5
            </span>
          )}
        </Link>

        <Link 
          to="/cart" 
          className={`flex flex-col items-center text-[10px] font-bold relative ${
            location.pathname === '/cart' ? 'text-violet-600' : 'text-gray-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>Cart</span>
          {totalItemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-violet-600 text-white text-[8px] font-extrabold px-1 rounded-full">
              {totalItemCount}
            </span>
          )}
        </Link>
      </div>
    </>
  );
}
