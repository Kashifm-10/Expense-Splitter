import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TenantCreator from './components/TenantCreator';
import AdminLogin from './components/AdminLogin';
import AdminTenantList from './components/AdminTenantList';
import AdminTenantDetail from './components/AdminTenantDetail';
import AdminEditTenant from './components/AdminEditTenant';
import TenantRegister from './components/TenantRegister';
import TenantLogin from './components/TenantLogin';
import Groups from './components/Groups';
import GroupDetail from './components/GroupDetail';
import Settlement from './components/Settlement';
import { getBrandVars } from './components/brandTheme';
import { SunIcon, MoonIcon } from './Icons';
import Modal from './components/Modal';
import './theme.css';
import './App.css';

const API = 'http://127.0.0.1:8000/api';
const USER_TOKEN_KEY = 'app_token';
const USER_TENANT_INFO_KEY = 'app_tenantInfo';
const USER_NAME_KEY = 'app_user_name';
const USER_UUID_KEY = 'app_user_uuid';
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_INFO_KEY = 'admin_info';
const THEME_KEY = 'app_theme';

const storedUserToken = localStorage.getItem(USER_TOKEN_KEY);
const storedUserTenantInfo = localStorage.getItem(USER_TENANT_INFO_KEY) ? JSON.parse(localStorage.getItem(USER_TENANT_INFO_KEY)) : null;
const storedUserName = localStorage.getItem(USER_NAME_KEY) || '';
const storedUserUuid = localStorage.getItem(USER_UUID_KEY) || '';
const storedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
const storedAdminInfo = localStorage.getItem(ADMIN_INFO_KEY) ? JSON.parse(localStorage.getItem(ADMIN_INFO_KEY)) : null;
const storedTheme = localStorage.getItem(THEME_KEY) || 'dark';


function App() {
  const [userToken, setUserToken] = useState(storedUserToken);
  const [userTenantInfo, setUserTenantInfo] = useState(storedUserTenantInfo);
  const [userName, setUserName] = useState(storedUserName);
  const [userUuid, setUserUuid] = useState(storedUserUuid);
  const [adminToken, setAdminToken] = useState(storedAdminToken);
  const [adminInfo, setAdminInfo] = useState(storedAdminInfo);
  const [verified, setVerified] = useState(false);
  const [theme, setTheme] = useState(storedTheme);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutType, setLogoutType] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const confirmLogout = () => {
    setShowLogoutModal(false);

    if (logoutType === 'user') {
      handleUserLogout();
    } else if (logoutType === 'admin') {
      handleAdminLogout();
    }

    setLogoutType(null);
  };

  const handleUserLogin = (jwt, tenantData, name, uuid) => {
    localStorage.setItem(USER_TOKEN_KEY, jwt);
    localStorage.setItem(USER_TENANT_INFO_KEY, JSON.stringify(tenantData));
    localStorage.setItem(USER_NAME_KEY, name || '');
    localStorage.setItem(USER_UUID_KEY, uuid || '');
    setUserToken(jwt);
    setUserTenantInfo(tenantData);
    setUserName(name || '');
    setUserUuid(uuid || '');
  };

  const handleUserLogout = () => {
    const tenantId = userTenantInfo?.tenant_id;
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_TENANT_INFO_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_UUID_KEY);
    setUserToken(null);
    setUserTenantInfo(null);
    setUserName('');
    setUserUuid('');
    navigate(`/t/${tenantId || ''}/login`);
  };

  const handleAdminLogin = (jwt, info) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, jwt);
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
    setAdminToken(jwt);
    setAdminInfo(info);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    localStorage.removeItem('admin_tenant_token');
    setAdminToken(null);
    setAdminInfo(null);
    navigate('/admin/login');
  };

  useEffect(() => {
    if (adminToken && location.pathname === '/admin/login') {
      navigate('/admin/tenants');
    }
  }, [adminToken, location.pathname, navigate]);

  useEffect(() => {
    const verifySessions = async () => {
      const currentPath = location.pathname;

      if (adminToken) {
        try {
          await axios.get(`${API}/admin/verify/`, { headers: { Authorization: `Bearer ${adminToken}` } });
        } catch (err) {
          handleAdminLogout();
          if (currentPath.startsWith('/admin/') && !currentPath.startsWith('/admin/login')) {
            navigate('/admin/login');
          }
        }
      }

      if (userToken && userTenantInfo) {
        try {
          await axios.get(`${API}/t/${userTenantInfo.tenant_id}/verify/`, { headers: { Authorization: `Bearer ${userToken}` } });
        } catch (err) {
          handleUserLogout();
        }
      }

      setVerified(true);
    };
    verifySessions();
  }, []);

  const isUserLoggedIn = userToken && userTenantInfo && verified;
  const isAdminLoggedIn = adminToken && adminInfo && verified;

  if (!verified) return <div className="lg-app-loading">Loading...</div>;

  const showUserNav = isUserLoggedIn && location.pathname.includes('/groups');
  const showAdminNav = isAdminLoggedIn && (location.pathname === '/admin/tenants' || location.pathname.startsWith('/admin/tenants/'));

  return (
    <>
      <button
        className="lg-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </button>
      {showUserNav && (
        <nav className="lg-navbar" style={getBrandVars(userTenantInfo?.primary_color)}>
          <span className="lg-navbar__brand">{userTenantInfo?.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="lg-navbar__user">{userName}</span>
            <button
              className="lg-navbar__logout"
              onClick={() => {
                setLogoutType('user');
                setShowLogoutModal(true);
              }}
            >
              Logout
            </button>
          </div>
        </nav>
      )}
      {showAdminNav && (
        <nav className="lg-navbar lg-navbar--admin">
          <span className="lg-navbar__brand">Admin: {adminInfo?.name}</span>
          <button
            className="lg-navbar__logout"
            onClick={() => {
              setLogoutType('admin');
              setShowLogoutModal(true);
            }}
          >
            Logout
          </button>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/create" element={<TenantCreator />} />
        <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
        <Route path="/t/:tenantId/register" element={<TenantRegister onLogin={handleUserLogin} />} />
        <Route path="/t/:tenantId/login" element={<TenantLogin onLogin={handleUserLogin} />} />

        <Route path="/admin/tenants" element={
          isAdminLoggedIn ? <AdminTenantList adminToken={adminToken} adminInfo={adminInfo} /> : <Navigate to="/admin/login" />
        } />
        <Route path="/admin/tenants/:tenantId" element={
          isAdminLoggedIn ? <AdminTenantDetail adminToken={adminToken} /> : <Navigate to="/admin/login" />
        } />
        <Route path="/t/:tenantId/admin/edit" element={<AdminEditTenant />} />

        {isUserLoggedIn && userTenantInfo && (
          <>
            <Route path={`/t/${userTenantInfo.tenant_id}/groups`} element={<Groups token={userToken} tenantInfo={userTenantInfo} />} />
            <Route path={`/t/${userTenantInfo.tenant_id}/groups/:groupId`} element={<GroupDetail token={userToken} tenantInfo={userTenantInfo} />} />
            <Route path={`/t/${userTenantInfo.tenant_id}/groups/:groupId/settle`} element={<Settlement token={userToken} tenantInfo={userTenantInfo} />} />
          </>
        )}

        <Route path="*" element={
          isUserLoggedIn ? <Navigate to={`/t/${userTenantInfo.tenant_id}/groups`} />
            : isAdminLoggedIn ? <Navigate to="/admin/tenants" />
              : <Navigate to="/admin/login" />
        } />
      </Routes>
      <div style={getBrandVars('#12161F')}>
        <Modal
          isOpen={showLogoutModal}
          onClose={() => {
            setShowLogoutModal(false);
            setLogoutType(null);
          }}
          title="Logout"
          footer={
            <>
              <button
                className="lg-btn lg-btn--ghost"
                onClick={() => {
                  setShowLogoutModal(false);
                  setLogoutType(null);
                }}
              >
                Cancel
              </button>
              <button
                className="lg-btn lg-btn--danger"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </>
          }
        >
          <p>Are you sure you want to log out?</p>
        </Modal>
      </div>
    </>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
export default AppWrapper;