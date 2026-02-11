import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User, Package, Users, BarChart, ShieldAlert } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { getCurrentUser, getCurrentSession, setCurrentUser, setCurrentSession, getSyncQueue } from '../utils/storage';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();
  const syncQueue = getSyncQueue();

  if (!currentUser || !currentSession) {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? Make sure to close your cash session first.')) {
      setCurrentUser(null);
      setCurrentSession(null);
      navigate('/');
    }
  };

  const handleCloseSession = () => {
    navigate('/close-session');
  };

  const menuItems = [
    {
      icon: <Package size={20} />,
      label: 'Products & Categories',
      description: 'Manage products, prices, and categories',
      action: () => navigate('/admin/products'),
      adminOnly: true,
    },
    {
      icon: <Users size={20} />,
      label: 'Cashier Management',
      description: 'Add, edit, and manage cashier accounts',
      action: () => navigate('/admin/cashiers'),
      adminOnly: true,
    },
    {
      icon: <BarChart size={20} />,
      label: 'Sales Reports',
      description: 'View sales reports and analytics',
      action: () => navigate('/reports'),
      adminOnly: false,
    },
    {
      icon: <Package size={20} />,
      label: 'Kitchen Board',
      description: 'View and manage orders',
      action: () => navigate('/orders'),
      adminOnly: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <AppHeader
        shopName="Sweet Delights Bakery"
        cashierName={currentUser.name}
        sessionStatus={`Session ${currentSession.id.slice(-4)}`}
        syncQueueCount={syncQueue.filter(s => s.status === 'PENDING').length}
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/pos')}>
              <ArrowLeft size={18} />
              Back to POS
            </Button>
            <h2>Settings</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                <User size={32} className="text-[var(--color-primary-dark)]" />
              </div>
              <div>
                <h3 className="mb-1">{currentUser.name}</h3>
                <StatusBadge variant={currentUser.role === 'ADMIN' ? 'warning' : 'info'}>
                  {currentUser.role}
                </StatusBadge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Username:</span>
                <span>{currentUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Session ID:</span>
                <span>{currentSession.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Opening Amount:</span>
                <span>${currentSession.openingAmount?.toFixed(2)
}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="secondary" fullWidth onClick={handleCloseSession}>
                <ShieldAlert size={18} />
                Close Cash Session
              </Button>
              <Button variant="danger" fullWidth onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          {menuItems.map((item, index) => {
            if (item.adminOnly && currentUser.role !== 'ADMIN') {
              return null;
            }
            return (
              <button
                key={index}
                onClick={item.action}
                className="bg-white rounded-lg p-6 shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="mb-1">{item.label}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {/* System Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Connection:</span>
                <StatusBadge variant="success">Online</StatusBadge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Pending Sync:</span>
                <span>{syncQueue.filter(s => s.status === 'PENDING').length} events</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Version:</span>
                <span>1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
