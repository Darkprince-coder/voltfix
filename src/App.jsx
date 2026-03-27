import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import { useInventory }          from './hooks/useInventory'
import { useJobs }               from './hooks/useJobs'
import { usePayments }           from './hooks/usePayments'

import Sidebar   from './components/layout/Sidebar'
import Topbar    from './components/layout/Topbar'
import { PageSpinner } from './components/ui/index'

import LoginPage    from './pages/LoginPage'
import Dashboard    from './pages/Dashboard'
import InventoryPage from './pages/InventoryPage'
import JobsPage     from './pages/JobsPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage  from './pages/ReportsPage'

// ── Inner app (authenticated) ───────────────────────────────────────
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // All data lives here, passed as props to each page.
  // This avoids prop drilling through context for MVP simplicity.
  const inv      = useInventory()
  const jobsHook = useJobs()
  const payHook  = usePayments()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar on large screens */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          lowStockCount={inv.lowStockItems.length}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  jobs={jobsHook.jobs}
                  payments={payHook.payments}
                  inventory={inv.items}
                  loadingJobs={jobsHook.loading}
                  loadingPayments={payHook.loading}
                  loadingInventory={inv.loading}
                />
              }
            />
            <Route
              path="/inventory"
              element={
                <InventoryPage
                  items={inv.items}
                  loading={inv.loading}
                  addItem={inv.addItem}
                  updateItem={inv.updateItem}
                  deleteItem={inv.deleteItem}
                />
              }
            />
            <Route
              path="/jobs"
              element={
                <JobsPage
                  jobs={jobsHook.jobs}
                  loading={jobsHook.loading}
                  inventory={inv.items}
                  addJob={jobsHook.addJob}
                  updateJob={jobsHook.updateJob}
                  updateJobStatus={jobsHook.updateJobStatus}
                  deleteJob={jobsHook.deleteJob}
                  reduceStock={inv.reduceStock}
                  restoreStock={inv.restoreStock}
                />
              }
            />
            <Route
              path="/payments"
              element={
                <PaymentsPage
                  payments={payHook.payments}
                  jobs={jobsHook.jobs}
                  loading={payHook.loading}
                  recordPayment={payHook.recordPayment}
                  deletePayment={payHook.deletePayment}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <ReportsPage
                  jobs={jobsHook.jobs}
                  payments={payHook.payments}
                  inventory={inv.items}
                  loading={jobsHook.loading || payHook.loading || inv.loading}
                />
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="py-3 text-center text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          VoltFix Repair Manager · Built for Kenyan repair shops
        </footer>
      </div>
    </div>
  )
}

// ── Auth gate ────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <PageSpinner />
      </div>
    )
  }

  return user ? <AppShell /> : <LoginPage />
}

// ── Root ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}