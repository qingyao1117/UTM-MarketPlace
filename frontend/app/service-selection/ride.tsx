"use client";

import { useState } from "react";

interface RidePlatformProps {
  router: any;
}

export default function RidePlatform({ router }: RidePlatformProps) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [bookingType, setBookingType] = useState<"now" | "later">("now");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Booking submitted! Backend needs to be deployed for actual booking.");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary-600">Ride-Hailing Platform</h1>
      <p className="text-gray-600 mb-8">Book a ride around campus and the city</p>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Type */}
          <div>
            <label className="block text-sm font-semibold mb-3">Booking Type</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer ${bookingType === "now" ? "border-primary-600 bg-primary-50" : "border-gray-300"}`}>
                <input type="radio" name="bookingType" value="now" checked={bookingType === "now"} onChange={() => setBookingType("now")} />
                <span>Book Now</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer ${bookingType === "later" ? "border-primary-600 bg-primary-50" : "border-gray-300"}`}>
                <input type="radio" name="bookingType" value="later" checked={bookingType === "later"} onChange={() => setBookingType("later")} />
                <span>Schedule for Later</span>
              </label>
            </div>
          </div>

          {/* Pickup and Dropoff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Pickup Location</label>
              <input 
                type="text" 
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                placeholder="Enter pickup location"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Drop-off Location</label>
              <input 
                type="text" 
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                placeholder="Enter drop-off location"
                required
              />
            </div>
          </div>

          {/* Passenger Count */}
          <div>
            <label className="block text-sm font-semibold mb-2">Passenger Count</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl"
              >-</button>
              <span className="text-xl font-semibold w-16 text-center">{passengerCount}</span>
              <button 
                type="button" 
                onClick={() => setPassengerCount(Math.min(6, passengerCount + 1))}
                className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl"
              >+</button>
            </div>
          </div>

          {/* Scheduled Time */}
          {bookingType === "later" && (
            <div>
              <label className="block text-sm font-semibold mb-2">Scheduled Time</label>
              <input 
                type="datetime-local" 
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
          )}

          {/* Estimated Fare */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Estimated Fare: <strong className="text-2xl text-primary-600">RM {((passengerCount - 1) * 2 + 8).toFixed(2)}</strong></p>
            <p className="text-xs text-blue-500 mt-1">Base fare: RM 8.00 + RM 2.00 per additional passenger</p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors">
            Book Ride
          </button>
        </form>
      </div>
    </div>
  );
}
