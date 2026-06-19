import { useState } from 'react'
import DashboardPage from '@/pages/DashboardPage'
import ApiTestPage from '@/pages/ApiTest'
import ProtectedRoute from './components/ProtectedRoute' 
function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'apitest'
  const handleLogout = () => {
    window.location.href = "/do/logout";
  };
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      <header className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#32363a]">Customer Schedule Dashboard</h1>
        {/* DEV nav — remove before go-live */}
        <div className="flex gap-2">
          <button
            onClick={() => setPage('dashboard')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full border transition-colors ${
              page === 'dashboard'
                ? 'bg-[#0a6ed1] text-white border-[#0a6ed1]'
                : 'bg-white text-[#6a6d70] border-[#e5e5e5] hover:border-[#0a6ed1]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setPage('apitest')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full border transition-colors ${
              page === 'apitest'
                ? 'bg-[#0a6ed1] text-white border-[#0a6ed1]'
                : 'bg-white text-[#6a6d70] border-[#e5e5e5] hover:border-[#0a6ed1]'
            }`}
          >
            API Test
          </button>
           <button
            onClick={handleLogout}
            className="px-3 py-1 text-[12px] font-semibold rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {page === 'dashboard' ? <DashboardPage /> : <ApiTestPage />}
    </div>
  </ProtectedRoute>
)
}
export default App