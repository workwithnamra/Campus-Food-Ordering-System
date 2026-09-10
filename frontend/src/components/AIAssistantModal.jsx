import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Plus, Check, ArrowRight, Flame, Leaf, ShoppingCart, Clock, HeartHandshake } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function AIAssistantModal({ isOpen, onClose, allMenuItems }) {
  const { addToCart } = useCart();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hey Aarav! 👋 I'm your SVKM Campus Foodie AI. Tell me what you're craving, your break duration, calorie/protein goals, or budget, and I'll build you the perfect recommendation or combo meal!",
      recommendations: [],
      combo: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState([]);
  const [comboAdded, setComboAdded] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "🥪 Best Pav Bhaji Combo for 2", query: "Give me the best Pav Bhaji meal combo for 2 friends with extra pav and drinks" },
    { label: "🌿 100% Jain Feast under ₹150", query: "Show me a pure Jain meal under 150 rupees" },
    { label: "🏃‍♂️ 10-Min Lecture Break Snacks", query: "I have only 10 minutes between lectures, give me fastest snacks" },
    { label: "💪 Post-Gym High Protein Stack", query: "Recommend high protein food with over 20g protein" },
    { label: "🍨 Late-Lecture Sweet Craving", query: "Suggest the best dessert or chocolate brownie" }
  ];

  const handleSend = (userQuery) => {
    const query = userQuery || input;
    if (!query.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      let matched = [];
      let responseText = "";
      let comboData = null;

      if (q.includes('combo') || q.includes('for 2') || q.includes('friends') || q.includes('budget meal')) {
        // Generate a smart campus combo meal
        const main = (allMenuItems || []).find(i => i.name.toLowerCase().includes('pav bhaji')) || (allMenuItems || [])[0];
        const drink = (allMenuItems || []).find(i => i.category.toLowerCase().includes('juice') || i.name.toLowerCase().includes('cold coffee')) || (allMenuItems || [])[1];
        const dessert = (allMenuItems || []).find(i => i.category.toLowerCase().includes('dessert') || i.name.toLowerCase().includes('brownie')) || (allMenuItems || [])[2];
        
        comboData = {
          name: "SVKM Student Duo Feast Combo 🎁",
          items: [main, drink, dessert].filter(Boolean),
          totalPrice: (main?.price || 120) + (drink?.price || 80) + (dessert?.price || 140),
          discountSavings: 40,
          reason: "Perfect balance of savory street spice, refreshing beverage, and rich chocolate fudge to share!"
        };
        responseText = "I've curated an exclusive SVKM Campus Combo Meal for you! Everything is pre-matched for flavor and speed:";
        matched = comboData.items;

      } else if (q.includes('jain') || q.includes('no onion') || q.includes('no garlic')) {
        matched = (allMenuItems || []).filter(i => i.is_jain);
        if (q.includes('150') || q.includes('100') || q.includes('budget')) {
          matched = matched.filter(i => i.price <= 150);
          responseText = "Here is a 100% certified Jain meal selection under ₹150 prepared with raw bananas and fresh spices:";
        } else {
          responseText = "Our 6th Floor Jain kitchen prepares these strictly without onion, garlic, or root vegetables:";
        }
      } else if (q.includes('10 min') || q.includes('break') || q.includes('lecture') || q.includes('fast') || q.includes('quick')) {
        matched = (allMenuItems || []).filter(i => 
          i.category.toLowerCase().includes('snack') && i.price <= 70
        );
        responseText = "⚡ Lecture break rush mode! These items are hot and ready at Ground Floor counter with <5 min prep time:";
      } else if (q.includes('protein') || q.includes('gym') || q.includes('fitness') || q.includes('muscle')) {
        matched = (allMenuItems || []).filter(i => 
          i.category.toLowerCase().includes('protein') || 
          i.name.toLowerCase().includes('protein') || 
          i.name.toLowerCase().includes('paneer')
        );
        responseText = "💪 High-protein campus fuel! Ideal for energy and muscle recovery:";
      } else if (q.includes('dessert') || q.includes('sweet') || q.includes('chocolate') || q.includes('brownie')) {
        matched = (allMenuItems || []).filter(i => 
          i.category.toLowerCase().includes('dessert') || 
          i.category.toLowerCase().includes('ice cream')
        );
        responseText = "🍨 Craving something sweet? Check out these top student-rated desserts:";
      } else {
        matched = (allMenuItems || []).filter(i => 
          i.name.toLowerCase().includes(q) || 
          i.desc.toLowerCase().includes(q) || 
          i.category.toLowerCase().includes(q)
        );
        if (matched.length === 0) {
          matched = (allMenuItems || []).slice(0, 3);
          responseText = `I couldn't find an exact dish for "${query}", but here are the top trending dishes right now:`;
        } else {
          responseText = `Here are the best cafeteria recommendations matching "${query}":`;
        }
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: responseText,
          recommendations: matched.slice(0, 3),
          combo: comboData
        }
      ]);
      setIsThinking(false);
    }, 600);
  };

  const handleAddToCart = (item) => {
    addToCart(item, item.custom_options ? [item.custom_options[0]].filter(Boolean) : []);
    setAddedItemIds(prev => [...prev, item.id]);
    setTimeout(() => {
      setAddedItemIds(prev => prev.filter(id => id !== item.id));
    }, 2000);
  };

  const handleAddComboToCart = (combo) => {
    combo.items.forEach(item => {
      addToCart(item, []);
    });
    setComboAdded(true);
    setTimeout(() => setComboAdded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white p-4 flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-heading font-black text-base">SVKM Foodie AI</h3>
                <span className="text-[9px] bg-amber-400 text-gray-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  V2.0 SMART
                </span>
              </div>
              <p className="text-[11px] text-white/80">Personalized Combos, Break Timings & Diet Planner</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              
              <div className={`flex items-start space-x-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                  msg.sender === 'user' ? 'bg-gray-800' : 'bg-violet-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-3 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-violet-600 text-white rounded-tr-sm font-medium' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>

              {/* Special Smart Combo Meal Card */}
              {msg.combo && (
                <div className="mt-3 w-full bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-4 pl-8 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-black text-xs text-amber-950">
                      {msg.combo.name}
                    </span>
                    <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      SAVE ₹{msg.combo.discountSavings}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 mb-3 italic">
                    "{msg.combo.reason}"
                  </p>

                  <div className="space-y-1.5 mb-3">
                    {msg.combo.items.map((it, i) => (
                      <div key={i} className="flex justify-between items-center text-xs text-gray-800">
                        <span>• {it.name}</span>
                        <span className="font-bold">₹{it.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block leading-none">Combo Bill</span>
                      <span className="text-base font-black text-gray-950 font-heading">
                        ₹{msg.combo.totalPrice}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddComboToCart(msg.combo)}
                      className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs px-4 py-2 rounded-2xl shadow transition flex items-center space-x-1"
                    >
                      {comboAdded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      <span>{comboAdded ? "Combo Added!" : "Add Entire Combo"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Recommendations List */}
              {msg.recommendations && msg.recommendations.length > 0 && !msg.combo && (
                <div className="mt-2.5 w-full space-y-2 pl-9">
                  {msg.recommendations.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-gray-200 rounded-2xl p-2.5 flex items-center justify-between shadow-sm hover:border-violet-300 transition"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-gray-900 text-xs block truncate">{item.name}</span>
                          <span className="font-black text-gray-900 text-xs">₹{item.price}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 flex-shrink-0 ${
                          addedItemIds.includes(item.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white'
                        }`}
                      >
                        {addedItemIds.includes(item.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}

          {isThinking && (
            <div className="flex items-center space-x-2 text-gray-400 pl-2">
              <Bot className="w-4 h-4 animate-bounce text-violet-600" />
              <span className="text-xs italic font-semibold">AI is analyzing campus queues, calories & menus...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-t border-gray-100 bg-gray-50 flex items-center space-x-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="px-2.5 py-1 bg-white hover:bg-violet-50 text-gray-700 hover:text-violet-800 rounded-xl text-[11px] font-bold border border-gray-200 transition flex-shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-gray-100 bg-white flex items-center space-x-2 flex-shrink-0">
          <input 
            type="text"
            placeholder="Ask AI: e.g. Budget lunch for 2, high protein, break in 10 mins..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600"
          />
          <button
            onClick={() => handleSend()}
            className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-2xl transition shadow-md shadow-violet-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
