import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import MasterData from './pages/MasterData';
import Login from './pages/Login';
import { 
  Trophy, 
  Calendar, 
  Database, 
  FileText, 
  Home, 
  Menu,
  BookOpen,
  LogOut
} from 'lucide-react';

function AppContent() {
  const { token, user, login, logout } = useAppState();
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard | attendance | reports | database
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
 
  const renderPage = () => {
    // If the user somehow accesses database tab without being an admin, reset to dashboard
    if (currentPage === 'database' && user?.role !== 'admin') {
      return <Dashboard setCurrentPage={setCurrentPage} />;
    }
 
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports />;
      case 'database':
        return <MasterData />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };
 
  // Redirect to Login if not authenticated
  if (!token || !user) {
    return <Login onLoginSuccess={login} />;
  }

  return (
    <div className="app-container">
      {/* 1. Desktop Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">PQ</div>
          <div className="logo-text">
            <h1>MA PIQ</h1>
            <span>Takhosus Program</span>
          </div>
        </div>
 
        <div style={{ padding: '0 8px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', overflow: 'hidden' }}>
          <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</p>
          <p style={{ fontSize: '9px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Role: {user?.role}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => setCurrentPage('dashboard')} 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Beranda</span>
          </button>

          <button 
            onClick={() => setCurrentPage('attendance')} 
            className={`nav-item ${currentPage === 'attendance' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Presensi & Jurnal</span>
          </button>

          <button 
            onClick={() => setCurrentPage('reports')} 
            className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Laporan & Rekap</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => setCurrentPage('database')} 
              className={`nav-item ${currentPage === 'database' ? 'active' : ''}`}
            >
              <Database size={18} />
              <span>Kelola Data Master</span>
            </button>
          )}
 
          <button 
            onClick={logout} 
            className="nav-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, paddingTop: '16px' }}
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>© 2026 MA PIQ Singosari</p>
          <p style={{ fontSize: '10px', marginTop: '2px' }}>v1.0.0-Frontend</p>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="main-content">
        {/* Desktop Topbar */}
        <header className="desktop-topbar">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="btn-toggle-sidebar"
            title={isSidebarCollapsed ? "Tampilkan Menu" : "Sembunyikan Menu"}
          >
            <Menu size={20} />
          </button>
          <span className="topbar-title">Sistem Presensi & Jurnal Takhosus - MA PIQ Singosari</span>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Halo, <strong>{user?.name}</strong></span>
          </div>
        </header>
 
        {/* Mobile Sticky Header */}
        <header className="mobile-header">
          <div className="mobile-logo">
            <div className="logo-icon">PQ</div>
            <h1>MA PIQ Takhosus</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '4px 8px', borderRadius: '4px' }}>
              {currentPage.toUpperCase()}
            </span>
            <button 
              onClick={logout} 
              style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Render Area */}
        <main style={{ flex: 1 }}>
          {renderPage()}
        </main>

        {/* Mobile Bottom Tab Navigation */}
        <nav className="mobile-nav-bar">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className={`mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>Beranda</span>
            <div className="active-indicator"></div>
          </button>

          <button 
            onClick={() => setCurrentPage('attendance')}
            className={`mobile-nav-item ${currentPage === 'attendance' ? 'active' : ''}`}
          >
            <Calendar size={20} />
            <span>Presensi</span>
            <div className="active-indicator"></div>
          </button>

          <button 
            onClick={() => setCurrentPage('reports')}
            className={`mobile-nav-item ${currentPage === 'reports' ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span>Laporan</span>
            <div className="active-indicator"></div>
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => setCurrentPage('database')}
              className={`mobile-nav-item ${currentPage === 'database' ? 'active' : ''}`}
            >
              <Database size={20} />
              <span>Data</span>
              <div className="active-indicator"></div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
