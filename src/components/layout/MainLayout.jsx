import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './MainLayout.css'

const MainLayout = ({ title, subtitle }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
