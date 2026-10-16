import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { BlockedTenantScreen } from '@/components/BlockedTenantScreen'
import { useAuth } from '@/contexts/AuthContext'

import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [sidebarPath, setSidebarPath] = useState<string | null>(null)
  const isSidebarOpen = sidebarPath === pathname

  function closeSidebar() {
    setSidebarPath(null)
    document.getElementById('dashboard-menu-button')?.focus()
  }

  if (user?.tenant?.active === false && user.role !== 'SUPER_ADMIN') {
    return <BlockedTenantScreen />
  }

  return (
    <div className="flex h-svh overflow-hidden bg-card">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setSidebarPath(pathname)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-card">
          <div className="px-6 py-8 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
