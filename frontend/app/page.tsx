"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <img 
          src={user.avatar_url || "https://i.pravatar.cc/150"} 
          alt={user.display_name} 
          className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.display_name}!</h1>
        <p className="text-gray-600 mb-6">@{user.username}</p>
        
        <div className="p-4 bg-gray-50 rounded-lg mb-6 text-left border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile Info</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-medium text-gray-500">Status:</span> 
              <span className="text-green-600 font-medium">Online</span>
            </p>
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-medium text-gray-500">User ID:</span> 
              <span>{user.id}</span>
            </p>
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-medium text-gray-500">Joined:</span> 
              <span>{new Date(user.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
