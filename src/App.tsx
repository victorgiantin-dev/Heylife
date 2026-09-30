/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { storage } from './services/storageService';
import { Navbar } from './components/layout/Navbar';
import { LoginScreen } from './components/auth/LoginScreen';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { SupervisorDashboard } from './components/dashboard/SupervisorDashboard';
import { RHDashboard } from './components/dashboard/RHDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { NotificationsModal } from './components/common/NotificationsModal';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [, setRefreshKey] = useState(0);

  // Initialize from storage
  useEffect(() => {
    const currentId = storage.getCurrentUserId();
    const users = storage.getUsers();
    const user = users.find(u => u.id === currentId);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setDefaultTabForRole(user.role);
    }
  }, []);

  const setDefaultTabForRole = (role: Role) => {
    switch (role) {
      case 'adm':
        setActiveTab('usuarios');
        break;
      case 'rh':
        setActiveTab('solicitacoes_gerais');
        break;
      case 'supervisor':
        setActiveTab('aprovacoes');
        break;
      case 'funcionario':
        setActiveTab('minhas_ferias');
        break;
    }
  };

  const handleLoginSuccess = (user: User) => {
    storage.setCurrentUserId(user.id);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setDefaultTabForRole(user.role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSelectUser = (user: User) => {
    storage.setCurrentUserId(user.id);
    setCurrentUser(user);
    setDefaultTabForRole(user.role);
  };

  const handleSelectRole = (role: Role) => {
    const users = storage.getUsers();
    const match = users.find(u => u.role === role) || users[0];
    handleSelectUser(match);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (currentUser) {
      const users = storage.getUsers();
      const updated = users.find(u => u.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  };

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculate unread notifications
  const allNotifs = storage.getNotifications();
  const unreadCount = allNotifs.filter(
    n => !n.read && (n.userId === currentUser.id || n.userId === 'all')
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Hospital Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      {/* Main Clinical Dashboard Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Role: FUNCIONÁRIO */}
        {currentUser.role === 'funcionario' && (
          <EmployeeDashboard
            currentUser={currentUser}
            onRefresh={triggerRefresh}
            initialOpenModal={activeTab === 'solicitar'}
            activeTab={activeTab}
          />
        )}

        {/* Role: SUPERVISOR */}
        {currentUser.role === 'supervisor' && (
          <SupervisorDashboard
            currentUser={currentUser}
            onRefresh={triggerRefresh}
            activeTab={activeTab}
          />
        )}

        {/* Role: RECURSOS HUMANOS (RH) */}
        {currentUser.role === 'rh' && (
          <RHDashboard
            currentUser={currentUser}
            onRefresh={triggerRefresh}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Role: ADMINISTRADOR (ADM) */}
        {currentUser.role === 'adm' && (
          <AdminDashboard
            currentUser={currentUser}
            onRefresh={triggerRefresh}
            activeTab={activeTab}
          />
        )}

      </main>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <NotificationsModal
          currentUser={currentUser}
          onClose={() => setShowNotifications(false)}
          onRefresh={triggerRefresh}
        />
      )}

      {/* Quiet Hospital Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">HeyLife Hospital</span>
            <span>·</span>
            <span>Unidade Hospitalar de Excelência Clínica</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Período Aquisitivo & Concessivo CLT</span>
            <span>·</span>
            <span>Conformidade com Escala Hospitalar</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
