"use client";

interface FoodPlatformProps {}

export default function FoodPlatform({}: FoodPlatformProps) {
  const sellers = [
    {
      id: 1,
      name: "Ahmed's Nasi Lemak",
      rating: 4.8,
      reviews: 124,
      items: [
        { id: 1, name: "Nasi Lemak", price: 6.50, stock: 50, cutoff: "11:00 AM", image: "Food" },
        { id: 2, name: "Nasi Goreng", price: 7.00, stock: 32, cutoff: "11:00 AM", image: "Food" },
        { id: 3, name: "Satay", price: 8.00, stock: 0, cutoff: "09:00 PM", image: "Food" },
        { id: 4, name: "Milo Ais", price: 3.50, stock: 100, cutoff: "10:00 PM", image: "Drink" },
      ]
    },
    {
      id: 2,
      name: "Teh Tarik Express",
      rating: 4.5,
      reviews: 89,
      items: [
        { id: 1, name: "Teh Tarik", price: 2.50, stock: 200, cutoff: "11:00 PM", image: "Drink" },
        { id: 2, name: "Kopi O", price: 2.00, stock: 150, cutoff: "11:00 PM", image: "Drink" },
        { id: 3, name: "Biscuits", price: 1.50, stock: 80, cutoff: "08:00 PM", image: "Snack" },
      ]
    },
    {
      id: 3,
      name: "Wan's Breakfast",
      rating: 4.7,
      reviews: 67,
      items: [
        { id: 1, name: "Roti Bakar", price: 3.00, stock: 45, cutoff: "10:00 AM", image: "Food" },
        { id: 2, name: "Kopi C", price: 2.20, stock: 120, cutoff: "10:00 AM", image: "Drink" },
        { id: 3, name: "Egg Pie", price: 4.00, stock: 28, cutoff: "10:30 AM", image: "Snack" },
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary-600">Food Delivery Platform</h1>
      <p className="text-gray-600 mb-8">Order from campus food vendors</p>

      <div className="grid gap-8">
        {sellers.map(seller => (
          <div key={seller.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Seller Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{seller.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < Math.floor(seller.rating) ? "text-yellow-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">{seller.rating} ({seller.reviews} reviews)</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                  Online
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Menu</h3>
              <div className="space-y-4">
                {seller.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                        {item.image}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          RM {item.price.toFixed(2)} | {item.stock > 0 ? `${item.stock} left` : "Out of Stock"}
                        </p>
                        <p className="text-xs text-red-500">Cut-off: {item.cutoff}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={item.stock === 0}>
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
