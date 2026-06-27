"use client";

import { useState } from "react";

interface ParcelPlatformProps {
  router: any;
}

export default function ParcelPlatform({ router }: ParcelPlatformProps) {
  const [collectionPoint, setCollectionPoint] = useState("");
  const [residentialCollege, setResidentialCollege] = useState("");
  const [parcelDescription, setParcelDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(120);

  const collectionPoints = [
    "Library UTM",
    "Academic Block A",
    "Academic Block B",
    "Student Hall 1",
    "Student Hall 2",
    "Sports Complex",
    "Admin Building"
  ];

  const residentialColleges = [
    "Dorm Block A",
    "Dorm Block B",
    "Dorm Block C",
    "Dorm Block D",
    "Dorm Block E",
    "International Student Hall"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Parcel order submitted! Backend needs to be deployed for actual booking.");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary-600">Parcel Delivery Platform</h1>
      <p className="text-gray-600 mb-8">Send packages across campus</p>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Point */}
          <div>
            <label className="block text-sm font-semibold mb-2">Collection Point</label>
            <select 
              value={collectionPoint}
              onChange={(e) => setCollectionPoint(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              required
            >
              <option value="">Select collection point</option>
              {collectionPoints.map(point => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
          </div>

          {/* Residential College */}
          <div>
            <label className="block text-sm font-semibold mb-2">Residential College (Drop-off)</label>
            <select 
              value={residentialCollege}
              onChange={(e) => setResidentialCollege(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              required
            >
              <option value="">Select residential college</option>
              {residentialColleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </div>

          {/* Parcel Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Parcel Description</label>
            <textarea 
              value={parcelDescription}
              onChange={(e) => setParcelDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              rows={3}
              placeholder="Describe your parcel (e.g., books, documents, small package)"
              required
            />
          </div>

          {/* Runner Info */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Available Runner
            </h3>
            <div className="mt-2">
              <p className="text-sm text-green-700"><strong className="text-green-900">Runner Name:</strong> John Doe</p>
              <p className="text-sm text-green-700"><strong className="text-green-900">Rating:</strong> 4.8 ⭐ (156 reviews)</p>
              <p className="text-sm text-green-700"><strong className="text-green-900">Available:</strong> Yes</p>
              <p className="text-sm text-green-700"><strong className="text-green-900">Estimated Arrival:</strong> 15-20 minutes</p>
            </div>
          </div>

          {/* Estimated Delivery Time */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Estimated Delivery Time: <strong className="text-2xl text-primary-600">{estimatedTime} minutes</strong></p>
            <p className="text-xs text-blue-500 mt-1">Based on current runner availability</p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors">
            Order Parcel
          </button>
        </form>
      </div>
    </div>
  );
}
