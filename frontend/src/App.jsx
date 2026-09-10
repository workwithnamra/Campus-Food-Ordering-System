import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import LoyaltyRewardsPage from './pages/LoyaltyRewardsPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { Utensils, Heart, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function App() {
  const [jainOnly, setJainOnly] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState('all'); // 'all' | 'ground' | '6th_floor' | '8th_floor'
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 font-sans selection:bg-violet-200 selection:text-violet-900">
          
          {/* Main Top Navigation Header */}
          <Navbar
            jainOnly={jainOnly}
            setJainOnly={setJainOnly}
            selectedCanteen={selectedCanteen}
            setSelectedCanteen={setSelectedCanteen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Router Content Views */}
          <main className="flex-grow">
            <Routes>
              <Route 
                path="/" 
                element={
                  <MenuPage 
                    jainOnly={jainOnly} 
                    selectedCanteen={selectedCanteen} 
                    setSelectedCanteen={setSelectedCanteen}
                  />
                } 
              />
              <Route 
                path="/menu" 
                element={
                  <MenuPage 
                    jainOnly={jainOnly} 
                    selectedCanteen={selectedCanteen} 
                    setSelectedCanteen={setSelectedCanteen}
                  />
                } 
              />
              <Route 
                path="/cart" 
                element={
                  <CartPage 
                    selectedCanteen={selectedCanteen}
                    setSelectedCanteen={setSelectedCanteen}
                  />
                } 
              />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/loyalty" element={<LoyaltyRewardsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Routes>
          </main>

          {/* Campus Cafeteria Footer */}
          <footer className="bg-white border-t border-gray-100 py-10 mt-16 text-gray-500 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold">
                    <Utensils className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="font-heading font-black text-base text-gray-900">
                    SVKM Crazy Canteen
                  </span>
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Official high-speed digital cafeteria platform designed for SVKM campus students & faculty members.
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block mb-3">
                  Campus Canteens
                </span>
                <ul className="space-y-2 text-gray-500">
                  <li className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ground Floor - Main Campus Plaza</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>6th Floor - Faculty & Student Hub (Jain)</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-violet-500" />
                    <span>8th Floor - Sky Gourmet Lounge</span>
                  </li>
                </ul>
              </div>

              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block mb-3">
                  Quick Links
                </span>
                <ul className="space-y-2">
                  <li>
                    <Link to="/" className="hover:text-violet-600 transition">
                      Full Menu (220+ Dishes)
                    </Link>
                  </li>
                  <li>
                    <Link to="/loyalty" className="hover:text-violet-600 transition">
                      5th Order Freebies & Loyalty
                    </Link>
                  </li>
                  <li>
                    <Link to="/orders" className="hover:text-violet-600 transition">
                      Kitchen Token Status
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block mb-3">
                  Campus Security & Trust
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Strict adherence to 100% vegetarian & Jain kitchen standards. Real-time digital UPI settlement via Razorpay.
                </p>
                <div className="pt-1 flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% FSSAI Certified Cafeterias</span>
                </div>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-gray-400 text-[11px]">
              <p>&copy; 2026 SVKM Crazy Canteen System. Crafted with passion for the Hackathon.</p>
              <p className="mt-2 sm:mt-0 flex items-center space-x-1">
                <span>Built for SVKM</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
                <span>Students & Faculty</span>
              </p>
            </div>
          </footer>

        </div>
      </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
