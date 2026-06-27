export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">UTM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Sign up to join UTM Student Marketplace</p>
        </div>
        <form className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent" placeholder="Enter your full name" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent" placeholder="Enter your @graduate.utm.my or @utm.my email" />
            <p className="text-xs text-gray-500 mt-1">UTM email required for verification</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent" placeholder="Create a password (min 12 characters)" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors">
            Sign Up
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Already have an account? <a href="/login" className="text-primary-600 font-bold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
