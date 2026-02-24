import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout({ children, title, isStaff, tabs, activeTab, onTabChange }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to={isStaff ? '/staff' : '/'} className="logo">
            <span className="logo-icon">✚</span>
            <span>MediConnect</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {tabs?.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => onTabChange?.(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.first_name} {user?.last_name}</strong><br />
            <span>{isStaff ? 'Staff' : 'Patient'}</span>
          </div>
          <button className="btn btn-secondary btn-small btn-block" onClick={logout} style={{ marginTop: '0.5rem' }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <h1>{title}</h1>
        </header>
        <div className="main">
          {children}
        </div>
      </main>
    </div>
  );
}
