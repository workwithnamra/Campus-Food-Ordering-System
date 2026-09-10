import React from 'react';
import { Clock, ChefHat, BellRing, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrderStatusBadge({ status, fulfillmentType }) {
  const norm = (status || '').toLowerCase();
  const isDelivery = fulfillmentType === 'delivery';

  switch (norm) {
    case 'placed':
      return (
        <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-black">
          <Clock className="w-3.5 h-3.5 animate-pulse text-blue-600" />
          <span>Placed</span>
        </span>
      );
    case 'preparing':
      return (
        <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-black">
          <ChefHat className="w-3.5 h-3.5 animate-bounce text-amber-600" />
          <span>Cooking in Kitchen</span>
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black shadow-sm ring-2 ring-emerald-200">
          <BellRing className="w-3.5 h-3.5 animate-wiggle text-emerald-600" />
          <span>{isDelivery ? 'Out for Delivery 🚀' : 'Ready at Counter 🔔'}</span>
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center space-x-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold">
          <CheckCircle className="w-3.5 h-3.5 text-gray-500" />
          <span>{isDelivery ? 'Delivered to Cabin ✔️' : 'Picked Up at Counter ✔️'}</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
          <span>{status}</span>
        </span>
      );
  }
}
