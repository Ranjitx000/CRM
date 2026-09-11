import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { useAuthStore } from '@/features/auth/auth.store';
import { Toaster } from '@/components/ui/sonner';

import { Login } from '@/features/auth/Login';
import { Dashboard } from '@/features/dashboard/Dashboard';

import { CustomersList } from '@/features/customers/CustomersList';
import { ProductsList } from '@/features/products/ProductsList';
import { ChallansList } from '@/features/challans/ChallansList';
import { UsersAdmin } from '@/features/users/UsersAdmin';

// Layout Component (Sidebar + Topbar)
import { Sidebar } from '@/app/layout/Sidebar';
import { Topbar } from '@/app/layout/Topbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar className="hidden md:flex" />
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <Topbar />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-8 sm:py-6 md:gap-8 max-w-[1400px] w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Base protection for all internal routes
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'customers', element: <CustomersList /> },
          { path: 'products', element: <ProductsList /> },
          { path: 'challans', element: <ChallansList /> },
          { 
            path: 'users', 
            element: <ProtectedRoute allowedRoles={['ADMIN']} />, 
            children: [{ index: true, element: <UsersAdmin /> }] 
          }
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}
