import React from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-2 border-b border-[var(--color-border)] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-6 py-3 text-base whitespace-nowrap transition-all duration-200
            ${activeTab === tab.id 
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' 
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id 
                ? 'bg-[var(--color-primary)] text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
