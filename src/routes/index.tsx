import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { useAuth, type UserRole } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { navItems } from '@/layouts/DashboardLayout/navigation'
import { ChecklistTemplatesPage } from '@/pages/ChecklistTemplates'
import { CustomersPage } from '@/pages/Customers'
import { DashboardPage } from '@/pages/Dashboard'
import { EquipmentsPage } from '@/pages/Equipments'
import { ForgotPasswordPage } from '@/pages/ForgotPassword'
import { InventoryPage } from '@/pages/Inventory'
import { LoginPage } from '@/pages/Login'
import { MasterPanelPage } from '@/pages/MasterPanel'
import { TenantDetailsPage } from '@/pages/MasterPanel/TenantDetails'
import { ResetPasswordPage } from '@/pages/ResetPassword'
import { ServiceOrderDetailsPage } from '@/pages/ServiceOrders/Details'
import { ServiceOrdersPage } from '@/pages/ServiceOrders'
import { SettingsPage } from '@/pages/Settings'
import { UsersPage } from '@/pages/Users'

function PrivateRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <DashboardLayout />
}

function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/equipamentos" element={<EquipmentsPage />} />
        <Route path="/checklists" element={<ChecklistTemplatesPage />} />
        <Route path="/estoque" element={<InventoryPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/ordens-de-servico" element={<ServiceOrdersPage />} />
        <Route
          path="/ordens-de-servico/:id"
          element={<ServiceOrderDetailsPage />}
        />
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/rpg-admin" element={<MasterPanelPage />} />
          <Route
            path="/rpg-admin/tenant/:id"
            element={<TenantDetailsPage />}
          />
        </Route>
        {navItems
          .filter(
            (item) =>
              item.to !== '/' &&
              item.to !== '/clientes' &&
              item.to !== '/usuarios' &&
              item.to !== '/equipamentos' &&
              item.to !== '/checklists' &&
              item.to !== '/estoque' &&
              item.to !== '/configuracoes' &&
              item.to !== '/ordens-de-servico',
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
