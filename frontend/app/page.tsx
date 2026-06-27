"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <ServiceSelection 
        service={selectedService} 
        onBack={handleBackToHome}
        router={router}
      />
    );
  }

  return <LandingPage router={router} onSelectService={handleServiceSelect} />;
}

function LandingPage({ router, onSelectService }: { router: any; onSelectService: (s: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 font-sans">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/login")}>
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
            <a href="/rides" className="px-8 py-4 bg-white/20 text-white rounded-full text-lg font-bold hover:bg-white/30 transition-all hover:scale-105 backdrop-blur-sm">
              Learn More
            </a>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mt-24 w-full max-w-6xl">
          <h2 className="text-3xl font-bold text-white mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ride Service */}
            <div onClick={() => onSelectService("ride")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ride-Hailing</h3>
              <p className="text-blue-100 text-sm">Book a ride around campus and the city</p>
            </div>

            {/* Food Service */}
            <div onClick={() => onSelectService("food")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Food Delivery</h3>
              <p className="text-blue-100 text-sm">Order from campus food vendors</p>
            </div>

            {/* Parcel Service */}
            <div onClick={() => onSelectService("parcel")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Parcel Delivery</h3>
              <p className="text-blue-100 text-sm">Send packages across campus</p>
            </div>

            {/* Printing Service */}
            <div onClick={() => onSelectService("printing")} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Printing</h3>
              <p className="text-blue-100 text-sm">Print documents online</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-8">
        <div className="text-center text-white/80">
          <p className="mb-2">&copy; 2024 UTM Student Marketplace</p>
          <p className="text-sm opacity-75">Designed for University Teknologi Malaysia</p>
        </div>
      </footer>
    </div>
  );
}

function ServiceSelection({ service, onBack, router }: { service: string; onBack: () => void; router: any }) {
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
          <a href="/login" className="px-4 py-2 bg-white/20 rounded-full text-sm">
            Login
          </a>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <button onClick={onBack} className="text-primary-600 hover:underline mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-2">
            {service === "ride" && "Ride-Hailing"}
            {service === "food" && "Food Delivery"}
            {service === "parcel" && "Parcel Delivery"}
            {service === "printing" && "Printing Service"}
          </h1>
          <p className="text-lg text-gray-600">
            {service === "ride" && "Book a ride around campus and the city"}
            {service === "food" && "Order from campus food vendors"}
            {service === "parcel" && "Send packages across campus"}
            {service === "printing" && "Print documents online"}
          </p>
        </div>

        {/* Demo Content - Replace with actual forms when backend is ready */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Service Coming Soon!</h2>
            <p className="text-gray-600 mb-6">
              This service requires backend deployment. Please contact your administrator to deploy the backend services.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={onBack}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Back to Services
              </button>
              <a 
                href="/login"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Login to Waitlist
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
