import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Sidebar({ onNavigate, currentView, hidden = false }) {
  const { t, lang, toggleLang, isRtl } = useLang();
  const { user, logout, hasPermission } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const isSuperAdmin = (user?.groups || []).some((g) => (typeof g === 'string' ? g : g?.name) === 'SuperAdmin');

  const menuItems = [
    { id: 'buildings', icon: '🏢', label: t('buildings'), visible: hasPermission('building@read') },
    { id: 'users', icon: '👥', label: t('users'), visible: hasPermission('rental-user@read') },
    { id: 'payout', icon: '💰', label: t('payoutReport'), visible: hasPermission('report@read') },
    { id: 'adminUsers', icon: '🔐', label: t('adminUsers'), visible: hasPermission('user@read') },
    { id: 'aiDashboard', icon: '🤖', label: t('aiDashboard'), visible: isSuperAdmin },
    { id: 'auditDashboard', icon: '📊', label: t('auditDashboard'), visible: isSuperAdmin },
  ].filter(item => item.visible);

  // Close sidebar on escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [expanded]);

  useEffect(() => {
    if (hidden && expanded) setExpanded(false);
  }, [hidden, expanded]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [expanded]);

  if (hidden) return null;

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        className={`sidebar-toggle ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? t('closeSidebar') : t('openSidebar')}
        aria-label={expanded ? t('closeSidebar') : t('openSidebar')}
        aria-expanded={expanded}
      >
        {expanded ? (isRtl ? '→' : '←') : '☰'}
      </button>

      {/* Overlay for mobile */}
      {expanded && (
        <div
          className="sidebar-overlay"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`sidebar ${expanded ? 'expanded' : ''}`}
        role="navigation"
        aria-label={t('mainNavigation') || 'Main navigation'}
      >
        <div className="sidebar-content">
          {/* Profile section - clickable */}
          <button
            className="sidebar-profile sidebar-profile-btn"
            onClick={() => {
              onNavigate('profile');
              setExpanded(false);
            }}
            type="button"
          >
            <div className="profile-avatar">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="sidebar-avatar-img" />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || '👤'}</span>
              )}
            </div>
            <span className="profile-name">{user?.name || t('guest') || 'Guest'}</span>
          </button>

          <div className="sidebar-divider"></div>

          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                setExpanded(false);
              }}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}

          <div className="sidebar-divider"></div>

          <button
            className="sidebar-item lang-toggle-item"
            onClick={toggleLang}
          >
            <span className="sidebar-icon" aria-hidden="true">🌐</span>
            <span className="sidebar-label">{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <button
            className="sidebar-item"
            onClick={toggleTheme}
          >
            <span className="sidebar-icon" aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            <span className="sidebar-label">{isDark ? t('lightMode') : t('darkMode')}</span>
          </button>

          <button
            className="sidebar-item logout-item"
            onClick={logout}
          >
            <span className="sidebar-icon" aria-hidden="true">🚪</span>
            <span className="sidebar-label">{t('logout')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
