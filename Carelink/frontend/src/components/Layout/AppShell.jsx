import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileTabBar from './MobileTabBar'
import './AppShell.css'

const AppShell = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Don't show layout on auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/verify-email'].includes(location.pathname)

  if (isAuthPage) return <>{children}</>

  return (
    <div className="app-shell">
      {!isMobile && <Sidebar />}

      <div className="app-main">
        <Topbar />
        <main className="app-content">{children}</main>
      </div>

      {isMobile && <MobileTabBar />}
    </div>
  )
}

export default AppShell
