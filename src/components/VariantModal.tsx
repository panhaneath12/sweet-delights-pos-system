import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { Product, ProductVariant, OrderItem } from '../types';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  editItem?: OrderItem | null;
  onConfirm: (item: OrderItem) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  isOpen,
  onClose,
  product,
  editItem,
  onConfirm,
}) => {
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);
  const [note, setNote] = useState('');
  const [lineDiscount, setLineDiscount] = useState<number>(0);

  useEffect(() => {
    if (editItem) {
      setSelectedVariants(editItem.variants);
      setNote(editItem.note || '');
      setLineDiscount(editItem.lineDiscount || 0);
    } else {
      setSelectedVariants([]);
      setNote('');
      setLineDiscount(0);
    }
  }, [editItem, isOpen]);

  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 0;

  const toggleVariant = (variant: ProductVariant) => {
    const exists = selectedVariants.find(v => v.id === variant.id);
    if (exists) {
      setSelectedVariants(selectedVariants.filter(v => v.id !== variant.id));
    } else {
      // Check if we're replacing a variant of the same type
      const sameTypeVariants = selectedVariants.filter(v => v.type === variant.type);
      if (sameTypeVariants.length > 0 && variant.type === 'SIZE') {
        // For size, only one can be selected
        setSelectedVariants([
          ...selectedVariants.filter(v => v.type !== 'SIZE'),
          variant
        ]);
      } else {
        setSelectedVariants([...selectedVariants, variant]);
      }
    }
  };

  const calculateTotal = () => {
    const variantTotal = selectedVariants.reduce((sum, v) => sum + v.extraPrice, 0);
    return product.basePrice + variantTotal - lineDiscount;
  };

  const handleConfirm = () => {
    const item: OrderItem = {
      id: editItem?.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      quantity: editItem?.quantity || 1,
      variants: selectedVariants,
      note: note || undefined,
      lineDiscount: lineDiscount || undefined,
      lineTotal: calculateTotal() * (editItem?.quantity || 1),
    };
    onConfirm(item);
    onClose();
  };

  // Group variants by type
  const variantsByType = product.variants?.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>) || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Item' : 'Add to Cart'} maxWidth="lg">
      <div className="space-y-6">
        {/* Product Info */}
        <div>
          <h4 className="mb-1">{product.name}</h4>
          <p className="text-[var(--color-text-secondary)]">Base Price: ${product.basePrice.toFixed(2)}</p>
        </div>

        {/* Variants */}
        {hasVariants && (
          <div className="space-y-4">
            {Object.entries(variantsByType).map(([type, variants]) => (
              <div key={type}>
                <h4 className="mb-3 text-sm text-[var(--color-text-secondary)]">{type}</h4>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const isSelected = selectedVariants.some(v => v.id === variant.id);
                    return (
                      <button
                        key={variant.id}
                        onClick={() => toggleVariant(variant)}
                        className={`
                          px-4 py-2 rounded-lg border-2 transition-all text-sm
                          ${isSelected 
                            ? 'border-[var(--color-primary)] bg-pink-50 text-[var(--color-primary)]' 
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary-light)]'
                          }
                        `}
                      >
                        {variant.name}
                        {variant.extraPrice > 0 && (
                          <span className="ml-1 text-xs">+${variant.extraPrice.toFixed(2)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block mb-2 text-sm">Special Instructions</label>
          <textarea
            className="w-full px-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
            rows={3}
            placeholder="Add any special instructions..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Line Discount */}
        <div>
          <label className="block mb-2 text-sm">Line Discount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            placeholder="0.00"
            value={lineDiscount || ''}
            onChange={(e) => setLineDiscount(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg">Item Total:</span>
            <span className="text-2xl text-[var(--color-primary)]">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleConfirm}>
            {editItem ? 'Update Item' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
