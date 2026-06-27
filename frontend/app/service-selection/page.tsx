"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RidePlatform from "./ride";
import FoodPlatform from "./food";
import ParcelPlatform from "./parcel";
import PrintingPlatform from "./printing";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
};

export default function ServiceSelection({ service, onBack, router }: { service: string; onBack: () => void; router: any }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-primary-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-primary-900 font-bold text-lg">UTM</span>
            </div>
            <span className="font-bold text-xl">Student Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowCart(!showCart)}
              className="relative px-4 py-2 bg-white/20 rounded-full text-sm"
            >
              Cart ({cart.length})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-primary-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <button onClick={onBack} className="text-primary-600 hover:underline mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {service === "food" && <FoodPlatform addToCart={addToCart} />}
        {service === "parcel" && <ParcelPlatform addToCart={() => {}} router={router} />}
        {service === "printing" && <PrintingPlatform addToCart={() => {}} router={router} />}
        {service === "ride" && <RidePlatform router={router} />}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">RM {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">x{item.quantity}</span>
                        <button onClick={() => removeFromCart(index)} className="text-red-500 hover:text-red-700">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-600">RM {cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Checkout feature coming soon!");
                      setCart([]);
                      setShowCart(false);
                    }}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
