import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Tabs, Tab } from '../components/Tabs';
import { ProductCard } from '../components/ProductCard';
import { CartItemRow } from '../components/CartItemRow';
import { AppHeader } from '../components/AppHeader';
import { ArrowLeft, Check, X, AlertCircle, Info } from 'lucide-react';
import type { Product, OrderItem } from '../types';

export const UIKit: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');

  const sampleProduct: Product = {
    id: 'sample',
    name: 'Chocolate Cake',
    basePrice: 35,
    categoryId: 'cat1',
    active: true,
  };

  const sampleCartItem: OrderItem = {
    id: 'item1',
    productId: 'sample',
    productName: 'Red Velvet Cake',
    basePrice: 40,
    quantity: 2,
    variants: [
      { id: 'v1', productId: 'sample', name: 'Large', extraPrice: 10, active: true, type: 'SIZE' },
    ],
    note: 'Extra frosting please',
    lineTotal: 100,
  };

  const tabs: Tab[] = [
    { id: 'tab1', label: 'Components', count: 8 },
    { id: 'tab2', label: 'Typography' },
    { id: 'tab3', label: 'Colors' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header Example */}
      <AppHeader
        shopName="UI Kit Demo"
        cashierName="Demo User"
        sessionStatus="Active"
        connectionStatus="online"
        syncQueueCount={3}
        onSettingsClick={() => alert('Settings clicked')}
      />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/pos')}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <div>
            <h1 className="mb-2">UI Kit & Design System</h1>
            <p className="text-[var(--color-text-secondary)]">
              Component library for the POS system
            </p>
          </div>
        </div>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="mb-6">Buttons</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h4 className="mb-4 text-[var(--color-text-secondary)]">Primary</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" size="sm">Small Button</Button>
                  <Button variant="primary" size="md">Medium Button</Button>
                  <Button variant="primary" size="lg">Large Button</Button>
                  <Button variant="primary" size="md" disabled>Disabled</Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h4 className="mb-4 text-[var(--color-text-secondary)]">Secondary</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="secondary" size="sm">Small Button</Button>
                  <Button variant="secondary" size="md">Medium Button</Button>
                  <Button variant="secondary" size="lg">Large Button</Button>
                </div>
              </div>

              {/* Ghost & Danger */}
              <div>
                <h4 className="mb-4 text-[var(--color-text-secondary)]">Ghost & Danger</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="ghost" size="md">Ghost Button</Button>
                  <Button variant="danger" size="md">Danger Button</Button>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <h4 className="mb-4 text-[var(--color-text-secondary)]">With Icons</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" size="md">
                    <Check size={18} />
                    With Icon
                  </Button>
                  <Button variant="secondary" size="md">
                    <X size={18} />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Full Width */}
              <div>
                <h4 className="mb-4 text-[var(--color-text-secondary)]">Full Width</h4>
                <Button variant="primary" size="lg" fullWidth>
                  Full Width Button
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Input Fields */}
        <section className="mb-12">
          <h2 className="mb-6">Input Fields</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Default Input" placeholder="Enter text..." />
              <Input label="With Helper Text" placeholder="Enter text..." helperText="This is helper text" />
              <Input label="With Error" placeholder="Enter text..." error="This field is required" />
              <Input label="Disabled Input" placeholder="Disabled..." disabled />
              <Input label="Number Input" type="number" placeholder="0.00" />
              <Input label="Password Input" type="password" placeholder="Enter password..." />
            </div>
          </div>
        </section>

        {/* Status Badges */}
        <section className="mb-12">
          <h2 className="mb-6">Status Badges</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex flex-wrap gap-4">
              <StatusBadge variant="success">Success</StatusBadge>
              <StatusBadge variant="warning">Warning</StatusBadge>
              <StatusBadge variant="error">Error</StatusBadge>
              <StatusBadge variant="info">Info</StatusBadge>
              <StatusBadge variant="default">Default</StatusBadge>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-12">
          <h2 className="mb-6">Tabs</h2>
          <div className="bg-white rounded-lg shadow-sm">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            <div className="p-8">
              <p className="text-[var(--color-text-secondary)]">
                Active tab: {activeTab}
              </p>
            </div>
          </div>
        </section>

        {/* Product Card */}
        <section className="mb-12">
          <h2 className="mb-6">Product Card</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="max-w-xs">
              <ProductCard
                product={sampleProduct}
                onAdd={(product) => alert(`Added ${product.name}`)}
              />
            </div>
          </div>
        </section>

        {/* Cart Item Row */}
        <section className="mb-12">
          <h2 className="mb-6">Cart Item Row</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="max-w-md">
              <CartItemRow
                item={sampleCartItem}
                onQuantityChange={(id, qty) => alert(`Changed quantity to ${qty}`)}
                onRemove={(id) => alert('Removed item')}
                onEdit={(id) => alert('Edit item')}
              />
            </div>
          </div>
        </section>

        {/* Modal */}
        <section className="mb-12">
          <h2 className="mb-6">Modal</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
              <div className="space-y-4">
                <p>This is an example modal dialog.</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Modals are used for important actions that require user attention.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" fullWidth onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="mb-6">Typography</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            <div>
              <h1>Heading 1</h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">2rem, 700 weight</p>
            </div>
            <div>
              <h2>Heading 2</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">1.5rem, 600 weight</p>
            </div>
            <div>
              <h3>Heading 3</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">1.25rem, 600 weight</p>
            </div>
            <div>
              <h4>Heading 4</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">1.125rem, 600 weight</p>
            </div>
            <div>
              <p>Body paragraph text with comfortable line height for reading.</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">1rem, 400 weight, 1.5 line-height</p>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="mb-6">Color Palette</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="h-20 rounded-lg bg-[var(--color-primary)] mb-2"></div>
                <p className="text-sm">Primary</p>
                <p className="text-xs text-[var(--color-text-secondary)]">#e91e63</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-[var(--color-secondary)] mb-2"></div>
                <p className="text-sm">Secondary</p>
                <p className="text-xs text-[var(--color-text-secondary)]">#ff9800</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-[var(--color-success)] mb-2"></div>
                <p className="text-sm">Success</p>
                <p className="text-xs text-[var(--color-text-secondary)]">#4caf50</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-[var(--color-warning)] mb-2"></div>
                <p className="text-sm">Warning</p>
                <p className="text-xs text-[var(--color-text-secondary)]">#ff9800</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-[var(--color-error)] mb-2"></div>
                <p className="text-sm">Error</p>
                <p className="text-xs text-[var(--color-text-secondary)]">#f44336</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Grid */}
        <section className="mb-12">
          <h2 className="mb-6">Spacing Grid (8px base)</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-[var(--color-primary)] rounded"></div>
                <p className="text-sm">8px (var(--spacing-1))</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-8 bg-[var(--color-primary)] rounded"></div>
                <p className="text-sm">16px (var(--spacing-2))</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48 h-8 bg-[var(--color-primary)] rounded"></div>
                <p className="text-sm">24px (var(--spacing-3))</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-64 h-8 bg-[var(--color-primary)] rounded"></div>
                <p className="text-sm">32px (var(--spacing-4))</p>
              </div>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section className="mb-12">
          <h2 className="mb-6">Icons (Lucide React)</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex flex-wrap gap-8">
              <div className="text-center">
                <Check size={32} className="mx-auto mb-2 text-[var(--color-success)]" />
                <p className="text-xs">Check</p>
              </div>
              <div className="text-center">
                <X size={32} className="mx-auto mb-2 text-[var(--color-error)]" />
                <p className="text-xs">X</p>
              </div>
              <div className="text-center">
                <AlertCircle size={32} className="mx-auto mb-2 text-[var(--color-warning)]" />
                <p className="text-xs">Alert</p>
              </div>
              <div className="text-center">
                <Info size={32} className="mx-auto mb-2 text-[var(--color-info)]" />
                <p className="text-xs">Info</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
