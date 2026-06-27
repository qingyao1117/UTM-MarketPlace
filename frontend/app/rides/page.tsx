export default function RidesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl">UTM Student Marketplace</span>
          <button className="px-4 py-2 bg-yellow-400 text-primary-900 rounded-full">Get Started</button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Ride-Hailing</h1>
        <p className="text-lg text-gray-600">Book a ride around campus and the city</p>
      </main>
    </div>
  );
}
