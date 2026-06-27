"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RidePlatform from "./service-selection/ride";
import FoodPlatform from "./service-selection/food";
import ParcelPlatform from "./service-selection/parcel";
import PrintingPlatform from "./service-selection/printing";

export default function Home() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
  };

  const handleBackToHome = () => {
    setSelectedService(null);
  };

  if (selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <nav className="bg-primary-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}>
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-primary-900 font-bold text-lg">UTM</span>
              </div>
              <span className="font-bold text-xl">Student Marketplace</span>
            </div>
            <a href="/login" className="px-4 py-2 bg-white/20 rounded-full text-sm">Login</a>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <button onClick={handleBackToHome} className="text-primary-600 hover:underline mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          {selectedService === "ride" && <RidePlatform router={router} />}
          {selectedService === "food" && <FoodPlatform />}
          {selectedService === "parcel" && <ParcelPlatform router={router} />}
          {selectedService === "printing" && <PrintingPlatform router={router} />}
        </div>
      </div>
    );
  }

  return <LandingPage onSelectService={handleServiceSelect} />;
}

function LandingPage({ onSelectService }: { onSelectService: (s: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 font-sans">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-primary-900 font-bold text-lg">UTM</span>
          </div>
          <span className="text-white font-bold text-xl">Student Marketplace</span>
        </div>
        <div className="flex gap-4">
          <a href="/login" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors font-medium">
            Login
          </a>
          <a href="/signup" className="px-4 py-2 bg-white text-primary-600 hover:bg-gray-100 rounded-full font-bold transition-colors shadow-lg">
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Campus,<br />One Marketplace
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Book rides, order food, send parcels, and print documents - all in one app.
            Designed for UTM students, by UTM students.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="/signup" className="px-8 py-4 bg-yellow-400 text-primary-900 rounded-full text-lg font-bold hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl">
              Get Started
            </a>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mt-24 w-full max-w-6xl">
          <h2 className="text-3xl font-bold text-white mb-12">Choose a Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard service="ride" label="Ride-Hailing" icon=" Ride" onSelect={onSelectService} />
            <ServiceCard service="food" label="Food Delivery" icon=" Food" onSelect={onSelectService} />
            <ServiceCard service="parcel" label="Parcel Delivery" icon=" Parcel" onSelect={onSelectService} />
            <ServiceCard service="printing" label="Printing" icon=" Print" onSelect={onSelectService} />
          </div>
        </div>
      </main>

      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-8">
        <div className="text-center text-white/80">
          <p className="mb-2">&copy; 2024 UTM Student Marketplace</p>
          <p className="text-sm opacity-75">Designed for University Teknologi Malaysia</p>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ service, label, icon, onSelect }: { service: string; label: string; icon: string; onSelect: (s: string) => void }) {
  return (
    <div onClick={() => onSelect(service)} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
      <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
      <p className="text-blue-100 text-sm">Book {label.toLowerCase()} around campus</p>
    </div>
  );
}
