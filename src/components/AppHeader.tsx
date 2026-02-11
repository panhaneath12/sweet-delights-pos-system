import React from 'react';
import { Clock, WifiOff, Cloud, Settings } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { ConnectionStatus } from '../types';

interface AppHeaderProps {
  shopName: string;
  cashierName?: string;
  sessionStatus?: string;
  connectionStatus?: ConnectionStatus;
  syncQueueCount?: number;
  onSettingsClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  shopName,
  cashierName,
  sessionStatus,
  connectionStatus = 'online',
  syncQueueCount = 0,
  onSettingsClick,
}) => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header className="bg-white border-b border-[var(--color-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Shop name and cashier */}
        <div className="flex items-center gap-6">
          <h2 className="text-[var(--color-primary)]">{shopName}</h2>
          {cashierName && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)]">Cashier:</span>
              <span>{cashierName}</span>
            </div>
          )}
          {sessionStatus && (
            <StatusBadge variant="success">{sessionStatus}</StatusBadge>
          )}
        </div>

        {/* Right: Status and time */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'offline' && (
              <StatusBadge variant="warning">
                <WifiOff size={14} className="mr-1" />
                Offline
              </StatusBadge>
            )}
            {connectionStatus === 'syncing' && (
              <StatusBadge variant="info">
                <Cloud size={14} className="mr-1" />
                Syncing...
              </StatusBadge>
            )}
            {syncQueueCount > 0 && (
              <StatusBadge variant="default">
                {syncQueueCount} queued
              </StatusBadge>
            )}
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Clock size={18} />
            <span>{formatTime(time)}</span>
          </div>

          {/* Settings */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
