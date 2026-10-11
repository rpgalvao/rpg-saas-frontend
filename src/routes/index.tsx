import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { navItems } from '@/layouts/DashboardLayout/navigation'
import { CustomersPage } from '@/pages/Customers'
import { DashboardPage } from '@/pages/Dashboard'
import { EquipmentsPage } from '@/pages/Equipments'
import { LoginPage } from '@/pages/Login'
import { UsersPage } from '@/pages/Users'

function PrivateRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <DashboardLayout />
}

function SectionPage({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Esta área ainda está em preparação.
      </p>
    </section>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/equipamentos" element={<EquipmentsPage />} />
        {navItems
          .filter(
            (item) =>
              item.to !== '/' &&
              item.to !== '/clientes' &&
              item.to !== '/usuarios' &&
              item.to !== '/equipamentos',
          )
          .map((item) => (
            <Route
              key={item.to}
              path={item.to}
              element={<SectionPage title={item.label} />}
            />
          ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
