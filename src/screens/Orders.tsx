import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Printer, Eye, ArrowLeft } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { getOrders, setOrders, getCurrentUser, getCurrentSession } from '../utils/storage';
import type { Order, OrderStatus } from '../types';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!currentUser || !currentSession) {
    navigate('/');
    return null;
  }

  const orders = getOrders()
    .filter(o => o.sessionId === currentSession.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColumns: { status: OrderStatus; label: string; color: string }[] = [
    { status: 'NEW', label: 'New', color: 'info' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'warning' },
    { status: 'READY', label: 'Ready', color: 'success' },
    { status: 'COMPLETED', label: 'Completed', color: 'default' },
  ];

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(o => o.status === status);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const allOrders = getOrders();
    const updatedOrders = allOrders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updatedOrders);
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: OrderStatus[] = ['NEW', 'IN_PROGRESS', 'READY', 'COMPLETED'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <AppHeader
        shopName="Sweet Delights Bakery"
        cashierName={currentUser.name}
        sessionStatus={`Session ${currentSession.id.slice(-4)}`}
        onSettingsClick={() => navigate('/settings')}
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/pos')}>
              <ArrowLeft size={18} />
              Back to POS
            </Button>
            <h2>Kitchen Board / Orders</h2>
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            {orders.length} total orders
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-4">
          {statusColumns.map(column => {
            const columnOrders = getOrdersByStatus(column.status);
            return (
              <div key={column.status} className="flex flex-col">
                {/* Column Header */}
                <div className="bg-white rounded-t-lg p-4 border-b-4 border-[var(--color-primary)]">
                  <div className="flex items-center justify-between">
                    <h4>{column.label}</h4>
                    <StatusBadge variant={column.color as any}>
                      {columnOrders.length}
                    </StatusBadge>
                  </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-gray-50 p-4 space-y-3 min-h-[500px] overflow-y-auto rounded-b-lg">
                  {columnOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm">{order.orderNo}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {formatTime(order.createdAt)}
                          </p>
                        </div>
                        <StatusBadge variant="info">
                          {order.orderType.replace('_', ' ')}
                        </StatusBadge>
                      </div>

                      {/* Items Count */}
                      <div className="mb-3">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="text-sm truncate">
                            {item.quantity}x {item.productName}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            +{order.items.length - 2} more
                          </p>
                        )}
                      </div>

                      {/* Note */}
                      {order.note && (
                        <div className="mb-3 p-2 bg-yellow-50 rounded text-xs italic">
                          {order.note}
                        </div>
                      )}

                      {/* Pickup Time for Preorder */}
                      {order.pickupTime && (
                        <div className="mb-3 text-xs text-[var(--color-text-secondary)]">
                          Pickup: {formatTime(order.pickupTime)}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = getNextStatus(order.status);
                              if (next) updateOrderStatus(order.id, next);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] transition-colors"
                          >
                            Move
                            <ChevronRight size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/receipt/${order.id}`);
                          }}
                          className="p-2 rounded border border-[var(--color-border)] hover:bg-gray-50 transition-colors"
                          title="View Receipt"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {columnOrders.length === 0 && (
                    <div className="text-center text-[var(--color-text-secondary)] py-8">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4">Order {selectedOrder.orderNo}</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Status</p>
                <StatusBadge>{selectedOrder.status.replace('_', ' ')}</StatusBadge>
              </div>

              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Items</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="mb-2 pb-2 border-b border-[var(--color-border)]">
                    <p className="text-sm">
                      {item.quantity}x {item.productName}
                    </p>
                    {item.variants.length > 0 && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {item.variants.map(v => v.name).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs italic text-[var(--color-text-secondary)]">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total:</span>
                  <span className="text-lg text-[var(--color-primary)]">
                    ${selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => navigate(`/receipt/${selectedOrder.id}`)}
                >
                  <Printer size={18} />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
