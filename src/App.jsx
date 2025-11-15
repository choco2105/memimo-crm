import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import ClientesList from './components/clientes/ClientesList'
import ProductosList from './components/productos/ProductosList'
import ComprasList from './components/compras/ComprasList'
import CampanasList from './components/campanas/CampanasList'
import Reportes from './components/reportes/Reportes'
import TestConexion from './components/TestConexion'
import './App.css'

/**
 * Componente principal de la aplicación
 * Configura las rutas y el layout
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout principal */}
        <Route path="/" element={<MainLayout title="Dashboard" subtitle="Bienvenido a Memimo CRM" />}>
          <Route index element={<Dashboard />} />
        </Route>

        {/* Clientes */}
        <Route path="/clientes" element={<MainLayout title="Clientes" subtitle="Gestión de clientes" />}>
          <Route index element={<ClientesList />} />
        </Route>

        {/* Productos */}
        <Route path="/productos" element={<MainLayout title="Productos" subtitle="Catálogo de productos" />}>
          <Route index element={<ProductosList />} />
        </Route>

        {/* Compras/Ventas */}
        <Route path="/compras" element={<MainLayout title="Ventas" subtitle="Historial de ventas" />}>
          <Route index element={<ComprasList />} />
        </Route>

        {/* Reportes */}
        <Route path="/reportes" element={<MainLayout title="Reportes" subtitle="Análisis y estadísticas" />}>
          <Route index element={<Reportes />} />
        </Route>

        {/* Campañas */}
        <Route path="/campanas" element={<MainLayout title="Campañas" subtitle="Marketing y promociones" />}>
          <Route index element={<CampanasList />} />
        </Route>

        {/* Test de conexión */}
        <Route path="/test" element={<TestConexion />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App