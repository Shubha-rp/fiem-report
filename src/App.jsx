import { useState } from 'react'
import DashboardPage from '@/pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute' 
function App() {
  const handleLogout = () => {
    window.location.href = "/do/logout";
  };
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      <header className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#32363a]">Customer Schedule Dashboard</h1>
           <button
            onClick={handleLogout}
            className="px-3 py-1 text-[12px] font-semibold rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
      </header>
      <DashboardPage />
    </div>
  </ProtectedRoute>
)
}
export default App