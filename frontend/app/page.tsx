"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleRideClick = () => {
    router.push("/rides");
  };

  const handleFoodClick = () => {
    router.push("/food");
  };

  const handleParcelClick = () => {
    router.push("/parcel");
  };

  const handlePrintingClick = () => {
    router.push("/printing");
  };

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
            <div onClick={handleRideClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ride-Hailing</h3>
              <p className="text-blue-100 text-sm">Book a ride around campus and the city</p>
            </div>

            {/* Food Service */}
            <div onClick={handleFoodClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Food Delivery</h3>
              <p className="text-blue-100 text-sm">Order from campus food vendors</p>
            </div>

            {/* Parcel Service */}
            <div onClick={handleParcelClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Parcel Delivery</h3>
              <p className="text-blue-100 text-sm">Send packages across campus</p>
            </div>

            {/* Printing Service */}
            <div onClick={handlePrintingClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl">
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
