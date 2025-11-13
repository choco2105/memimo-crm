import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import TestConexion from './components/TestConexion'
import './App.css'

/**
 * Componente principal de la aplicación
 * Configura las rutas y el layout
 */
function App() {
  // Para probar el dashboard, cambia showTest a false
  const showTest = false

  if (showTest) {
    return (
      <div className="App">
        <TestConexion />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal con Dashboard */}
        <Route path="/" element={<MainLayout title="Dashboard" subtitle="Bienvenido a Memimo CRM" />}>
          <Route index element={<Dashboard />} />
        </Route>

        {/* Test de conexión (ruta separada) */}
        <Route path="/test" element={<TestConexion />} />

        {/* Más rutas se agregarán aquí */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
