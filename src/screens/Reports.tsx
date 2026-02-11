import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, DollarSign, ShoppingCart, TrendingUp, ArrowLeft, Printer } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { getOrders, getCurrentUser, getCurrentSession, getUsers } from '../utils/storage';
import { formatMoney } from '../utils/format';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser || !currentSession) {
    navigate('/');
    return null;
  }

  const orders = getOrders();
  const sessionOrders = orders.filter(o => o.sessionId === currentSession.id);
  const users = getUsers();

  // Calculate stats
  const totalSales = sessionOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = sessionOrders.length;
  
  const cashPayments = sessionOrders.reduce((sum, o) => {
    const cashAmount = o.payments
      .filter(p => p.method === 'CASH')
      .reduce((s, p) => s + p.amount, 0);
    return sum + cashAmount;
  }, 0);
  
  const nonCashPayments = totalSales - cashPayments;

  // Payment method breakdown
  const paymentBreakdown = sessionOrders.reduce((acc, o) => {
    o.payments.forEach(p => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  // Filter orders for table
  const filteredOrders = sessionOrders
    .filter(o => 
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Order No', 'Date', 'Items', 'Total', 'Payment Methods'];
    const rows = filteredOrders.map(o => [
      o.orderNo,
      new Date(o.createdAt).toLocaleString(),
      o.items.length,
      o.total?.toFixed(2)
,
      o.payments.map(p => p.method).join(', '),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${currentSession.id}.csv`;
    a.click();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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
            <h2>Sales Report</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download size={18} />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Total Sales</p>
                <p className="text-2xl text-green-600">${totalSales?.toFixed(2)
}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Total Orders</p>
                <p className="text-2xl text-blue-600">{totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Avg Order Value</p>
                <p className="text-2xl text-purple-600">
                  ${totalOrders > 0 ? (totalSales / totalOrders)?.toFixed(2)
 : '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <DollarSign size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Cash Sales</p>
                <p className="text-2xl text-orange-600">${cashPayments?.toFixed(2)
}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="mb-4">Payment Methods Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm">{method}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary)] h-2 rounded-full"
                        style={{ width: `${(amount / totalSales) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm w-20 text-right">${amount?.toFixed(2)
}</span>
                    <span className="text-xs text-[var(--color-text-secondary)] w-12 text-right">
                      {((amount / totalSales) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="mb-4">Session Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Session ID:</span>
                <span>{currentSession.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Opened At:</span>
                <span>{formatDateTime(currentSession.openedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Opening Amount:</span>
                <span>${currentSession.openingAmount?.toFixed(2)
}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Cash in Drawer:</span>
                <span className="text-green-600">
                  ${(currentSession.openingAmount + cashPayments)?.toFixed(2)
}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Non-Cash:</span>
                <span>${nonCashPayments?.toFixed(2)
}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3>Order History</h3>
            <input
              type="text"
              placeholder="Search orders..."
              className="px-4 py-2 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Order No</th>
                  <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Type</th>
                  <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Items</th>
                  <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Payment</th>
                  <th className="px-6 py-3 text-right text-xs text-[var(--color-text-secondary)]">Total</th>
                  <th className="px-6 py-3 text-right text-xs text-[var(--color-text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const cashier = users.find(u => u.id === order.cashierId);
                  return (
                    <tr key={order.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                      <td className="px-6 py-4">{order.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.orderType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {order.payments.map(p => p.method).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ${formatMoney(order.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/receipt/${order.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
