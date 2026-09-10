import API_BASE from '../utils/api.js';
﻿import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Sparkles, Building2 } from 'lucide-react';

export default function RazorpayModal({ isOpen, onClose, amount, orderDetails, onSuccess }) {
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentId, setPaymentId] = useState('');

  if (!isOpen) return null;

  const playPaymentSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  };

  const handlePay = async () => {
    setStatus('creating');
    setErrorMsg('');
    try {
      const orderRes = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) })
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Could not create payment order');
      }
      const { order_id, key_id } = await orderRes.json();
      setStatus('idle');

      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'SVKM Canteen',
        description: orderDetails?.canteen_name || 'Food Order',
        order_id,
        prefill: {
          name: orderDetails?.user_name || 'Student',
          email: orderDetails?.user_email || 'student@svkm.edu',
          contact: ''
        },
        notes: { canteen: orderDetails?.canteen_name || 'Ground Floor Canteen' },
        theme: { color: '#0C2340' },
        handler: async (response) => {
          setStatus('verifying');
          try {
            const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || 'Payment verification failed');
            setPaymentId(response.razorpay_payment_id);
            setStatus('success');
            playPaymentSound();
            setTimeout(() => {
              onSuccess({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                payment_method: 'Razorpay',
                amount
              });
            }, 1600);
          } catch (verifyErr) {
            setStatus('error');
            setErrorMsg(verifyErr.message);
          }
        },
        modal: {
          ondismiss: () => setStatus('idle')
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setStatus('error');
        setErrorMsg(response.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const isProcessing = status === 'creating' || status === 'verifying';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#0C2340] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md">R</div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-base tracking-wide">Razorpay</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-0.5" />SECURE
                </span>
              </div>
              <p className="text-[11px] text-gray-300 flex items-center mt-0.5">
                <Building2 className="w-3 h-3 mr-1 text-gray-400" />SVKM Trust Cafeteria Services
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-gray-400 hover:text-white p-1 rounded-lg transition disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Due</span>
            <span className="text-2xl font-black text-[#0C2340]">&#8377;{amount}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 block font-semibold">Counter</span>
            <span className="text-xs font-bold text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200">
              {orderDetails?.canteen_name || 'Ground Floor'}
            </span>
          </div>
        </div>

        <div className="p-6">
          {status === 'success' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Payment Confirmed!</h3>
              <p className="text-xs text-gray-500">ID: <strong className="text-gray-900 font-mono">{paymentId}</strong></p>
              <div className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /><span>Kitchen token generated!</span>
              </div>
            </div>
          ) : (status === 'verifying' || status === 'creating') ? (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-gray-800">{status === 'creating' ? 'Preparing checkout...' : 'Verifying payment...'}</p>
              <p className="text-xs text-gray-400">Please wait, do not close this window.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {status === 'error' && (
                <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Pay via <strong>UPI, Card, Net Banking</strong> or <strong>Wallet</strong> through Razorpay's secure checkout.
              </p>
              <button onClick={handlePay} disabled={isProcessing} className="w-full py-3.5 bg-[#0C2340] hover:bg-blue-950 active:scale-95 text-white rounded-2xl text-sm font-black tracking-wide transition shadow-lg flex items-center justify-center space-x-2">
                <span>Pay &#8377;{amount} Securely</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Razorpay</span>
              </button>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit SSL Encrypted</span>
                </div>
                <span>NPCI UPI 2.0</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
