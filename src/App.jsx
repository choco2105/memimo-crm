import { useState } from 'react'
import TestConexion from './components/TestConexion'
import './App.css'

/**
 * Componente principal de la aplicación
 * Por ahora solo muestra el test de conexión
 */
function App() {
  return (
    <div className="App">
      <TestConexion />
    </div>
  )
}

export default App
