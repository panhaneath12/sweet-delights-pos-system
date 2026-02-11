import React from 'react';
import { Plus, Minus, Trash2, Edit } from 'lucide-react';
import type { OrderItem } from '../types';

interface CartItemRowProps {
  item: OrderItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onEdit: (itemId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onQuantityChange,
  onRemove,
  onEdit,
}) => {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg p-3 mb-2">
      {/* Product name and edit */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm">{item.productName}</p>
          {item.variants.length > 0 && (
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              {item.variants.map(v => v.name).join(', ')}
            </div>
          )}
          {item.note && (
            <div className="text-xs text-[var(--color-text-secondary)] italic mt-1">
              Note: {item.note}
            </div>
          )}
          {item.lineDiscount && item.lineDiscount > 0 && (
            <div className="text-xs text-green-600 mt-1">
              Discount: -${item.lineDiscount.toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(item.id)}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Edit item"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 rounded hover:bg-red-100 text-[var(--color-error)]"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Quantity controls and price */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="p-1 rounded border border-[var(--color-border)] hover:bg-gray-100 disabled:opacity-50"
            disabled={item.quantity <= 1}
          >
            <Minus size={14} />
          </button>
          <span className="text-sm min-w-[2rem] text-center">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="p-1 rounded border border-[var(--color-border)] hover:bg-gray-100"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-right">
          <p className="text-sm">${item.lineTotal.toFixed(2)}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            ${(item.lineTotal / item.quantity).toFixed(2)} each
          </p>
        </div>
      </div>
    </div>
  );
};
