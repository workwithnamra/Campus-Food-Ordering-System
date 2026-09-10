import React, { useState } from 'react';
import { X, Star, ThumbsUp, Sparkles, Check } from 'lucide-react';

export default function OrderReviewModal({ order, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const availableTags = [
    "🔥 Hot & Fresh",
    "🥪 Crispy Pav",
    "🌿 100% Authentic Jain",
    "⚡ Super Fast Prep",
    "😋 Loved the Flavors",
    "💯 Clean Packaging"
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          tags: selectedTags,
          comment
        })
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onReviewSubmitted();
          onClose();
        }, 1200);
      }
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-black font-heading text-gray-900">
              Rate Your SVKM Meal
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Order {order.order_code} • {order.canteen_name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-lg font-black text-gray-900">
              Thank you for your review!
            </h4>
            <p className="text-xs text-gray-500">
              Your feedback helps our cafeteria chefs serve you better food!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            
            {/* Star Rating */}
            <div className="text-center py-2">
              <div className="flex justify-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="font-extrabold text-gray-700 text-sm">
                {rating === 5 ? "Outstanding! Loved it 😍" :
                 rating === 4 ? "Very Good & Tasty 😊" :
                 rating === 3 ? "Average / Okay 🙂" : "Needs Improvement 😕"}
              </span>
            </div>

            {/* Quick Compliment Tags */}
            <div>
              <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2">
                What did you like?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full font-bold transition ${
                        isSelected
                          ? 'bg-amber-500 text-gray-950 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Field */}
            <div>
              <label className="font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Any message for the kitchen chef?
              </label>
              <textarea
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Loved the extra butter pav, very tasty!"
                className="w-full p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600 text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-violet-200 transition active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <span>Submit Review</span>
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
