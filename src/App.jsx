import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import ClientesList from './components/clientes/ClientesList'
import ProductosList from './components/productos/ProductosList'
import ComprasList from './components/compras/ComprasList'
import CampanasList from './components/campanas/CampanasList'
import Reportes from './components/reportes/reportes'
import GestionUsuarios from './components/usuarios/GestionUsuarios'
import TestConexion from './components/TestConexion'
import './App.css'

/**
 * Componente principal de la aplicación
 * Configura las rutas, autenticación y protección
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas - Dashboard */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout title="Dashboard" subtitle="Bienvenido a Memimo CRM" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
          </Route>

          {/* Rutas protegidas - Clientes */}
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <MainLayout title="Clientes" subtitle="Gestión de clientes" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientesList />} />
          </Route>

          {/* Rutas protegidas - Productos */}
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute>
                <MainLayout title="Productos" subtitle="Catálogo de productos" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProductosList />} />
          </Route>

          {/* Rutas protegidas - Ventas */}
          <Route 
            path="/compras" 
            element={
              <ProtectedRoute>
                <MainLayout title="Ventas" subtitle="Historial de ventas" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ComprasList />} />
          </Route>

          {/* Rutas protegidas - Campañas */}
          <Route 
            path="/campanas" 
            element={
              <ProtectedRoute>
                <MainLayout title="Campañas" subtitle="Marketing y promociones" />
              </ProtectedRoute>
            }
          >
            <Route index element={<CampanasList />} />
          </Route>

          {/* Rutas protegidas - Reportes */}
          <Route 
            path="/reportes" 
            element={
              <ProtectedRoute>
                <MainLayout title="Reportes" subtitle="Análisis y estadísticas" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Reportes />} />
          </Route>

          {/* Rutas protegidas - Gestión de Usuarios (SOLO ADMIN) */}
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout title="Gestión de Usuarios" subtitle="Administrar usuarios del sistema" />
              </ProtectedRoute>
            }
          >
            <Route index element={<GestionUsuarios />} />
          </Route>

          {/* Test de conexión - Protegido */}
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <TestConexion />
              </ProtectedRoute>
            } 
          />

          {/* Ruta por defecto - Redirigir al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App