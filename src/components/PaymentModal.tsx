import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { CreditCard, Smartphone, Building, DollarSign, Trash2 } from 'lucide-react';
import type { Payment, PaymentMethod } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  onConfirm: (payments: Payment[], printReceipt: boolean) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalDue,
  onConfirm,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [error, setError] = useState('');

  const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { method: 'CASH', label: 'Cash', icon: <DollarSign size={20} /> },
    { method: 'CARD', label: 'Card', icon: <CreditCard size={20} /> },
    { method: 'QR', label: 'QR Pay', icon: <Smartphone size={20} /> },
    { method: 'BANK', label: 'Bank', icon: <Building size={20} /> },
  ];

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalDue - totalPaid;

  const handleAddPayment = () => {
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentAmount > remaining) {
      setError(`Amount cannot exceed remaining balance of $${remaining?.toFixed(2)
}`);
      return;
    }

    if (selectedMethod !== 'CASH' && !reference.trim()) {
      setError('Reference number is required for non-cash payments');
      return;
    }

    const newPayment: Payment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method: selectedMethod,
      amount: paymentAmount,
      reference: selectedMethod !== 'CASH' ? reference : undefined,
    };

    setPayments([...payments, newPayment]);
    setAmount('');
    setReference('');
    setCashReceived('');
    setError('');
  };

  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(p => p.id !== paymentId));
  };

  const handleQuickCash = () => {
    if (selectedMethod !== 'CASH') return;
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < remaining) {
      setError(`Cash received must be at least $${remaining?.toFixed(2)
}`);
      return;
    }
    setAmount(remaining.toString());
    setError('');
  };

  const handleConfirmPayment = (printReceipt: boolean) => {
    if (remaining > 0.01) {
      setError('Payment is incomplete. Please add more payments.');
      return;
    }
    onConfirm(payments, printReceipt);
    // Reset
    setPayments([]);
    setAmount('');
    setReference('');
    setCashReceived('');
    setError('');
  };

  const calculateChange = () => {
    const received = parseFloat(cashReceived);
    if (isNaN(received)) return 0;
    return Math.max(0, received - remaining);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment" maxWidth="2xl">
      <div className="space-y-6">
        {/* Total Due */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Due</p>
              <p className="text-3xl text-[var(--color-primary)]">
                ${totalDue?.toFixed(2)
}
              </p>
            </div>
            {totalPaid > 0 && (
              <div className="text-right">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Remaining</p>
                <p className={`text-2xl ${remaining < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                  ${remaining?.toFixed(2)
}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block mb-3 text-sm">Payment Method</label>
          <div className="grid grid-cols-4 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.method}
                onClick={() => {
                  setSelectedMethod(pm.method);
                  setError('');
                }}
                className={`
                  p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                  ${selectedMethod === pm.method 
                    ? 'border-[var(--color-primary)] bg-pink-50 text-[var(--color-primary)]' 
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary-light)]'
                  }
                `}
              >
                {pm.icon}
                <span className="text-sm">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash Quick Payment */}
        {selectedMethod === 'CASH' && remaining > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm mb-3">Cash Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Cash Received"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => {
                    setCashReceived(e.target.value);
                    const received = parseFloat(e.target.value);
                    if (received >= remaining) {
                      setAmount(remaining.toString());
                    }
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Change</label>
                <div className="px-4 py-3 rounded-lg bg-white border-2 border-[var(--color-border)] text-lg">
                  ${calculateChange()?.toFixed(2)
}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Form */}
        <div className="border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-sm mb-3">Add Payment</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {selectedMethod !== 'CASH' && (
              <Input
                label="Reference Number"
                type="text"
                placeholder="Enter reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            )}
          </div>
          <Button variant="secondary" fullWidth onClick={handleAddPayment}>
            Add Payment
          </Button>
        </div>

        {/* Payment List */}
        {payments.length > 0 && (
          <div>
            <p className="text-sm mb-3">Payments Added</p>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {paymentMethods.find(pm => pm.method === payment.method)?.icon}
                    <div>
                      <p className="text-sm">{payment.method}</p>
                      {payment.reference && (
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Ref: {payment.reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>${payment.amount?.toFixed(2)
}</span>
                    <button
                      onClick={() => handleRemovePayment(payment.id)}
                      className="p-1 rounded hover:bg-red-100 text-[var(--color-error)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => handleConfirmPayment(false)}
            disabled={remaining > 0.01}
          >
            Save without Print
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => handleConfirmPayment(true)}
            disabled={remaining > 0.01}
          >
            Confirm & Print
          </Button>
        </div>
      </div>
    </Modal>
  );
};
