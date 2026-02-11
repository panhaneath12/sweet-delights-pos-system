// src/screens/MainPOS.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Package, Truck, Calendar, Pause } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { Tabs, type Tab } from "../components/Tabs";
import { ProductCard } from "../components/ProductCard";
import { CartItemRow } from "../components/CartItemRow";
import { Button } from "../components/Button";
import { VariantModal } from "../components/VariantModal";
import { PaymentModal } from "../components/PaymentModal";
import {
  getCurrentUser,
  getCurrentSession,
  getCategories,
  getProducts,
} from "../utils/storage";
import type { Product, OrderItem, OrderType, Payment } from "../types";
import { completeOrder } from "../pos/completeOrder";

export const MainPOS: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [orderNote, setOrderNote] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentSession) navigate("/");
  }, [currentUser, currentSession, navigate]);

  if (!currentUser || !currentSession) return null;

  const categories = useMemo(() => getCategories().filter((c) => c.active), []);
  const allProducts = useMemo(() => getProducts().filter((p) => p.active), []);

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.categoryId === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryTabs: Tab[] = [
    { id: "all", label: "All", count: allProducts.length },
    ...categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      count: allProducts.filter((p) => p.categoryId === cat.id).length,
    })),
  ];

  const handleAddProduct = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      setEditingItem(null);
      setVariantModalOpen(true);
      return;
    }

    const item: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      quantity: 1,
      variants: [],
      lineTotal: product.basePrice,
    };
    setCart((prev) => [...prev, item]);
  };

  const handleConfirmItem = (item: OrderItem) => {
    if (editingItem) {
      setCart((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } else {
      setCart((prev) => [...prev, item]);
    }
    setEditingItem(null);
  };

  const handleEditItem = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const product = allProducts.find((p) => p.id === item.productId);
    if (!product) return;

    setSelectedProduct(product);
    setEditingItem(item);
    setVariantModalOpen(true);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const variantsExtra = item.variants.reduce((sum, v) => sum + v.extraPrice, 0);
        const unitPrice = item.basePrice + variantsExtra - (item.lineDiscount || 0);
        return { ...item, quantity, lineTotal: unitPrice * quantity };
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.lineTotal, 0);

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal - orderDiscount) * 0.1;
  };

  const calculateTotal = () => calculateSubtotal() - orderDiscount + calculateTax();

  // ✅ PaymentModal calls: onConfirm(payments, printReceipt)
  const handlePayment = async (payments: Payment[] | any[], printReceipt: boolean) => {
    try {
      const normalizedPayments = (payments ?? []).map((p: any) => ({
        method: String(p.method ?? p.type ?? "CASH").toUpperCase(),
        amount: Number(p.amount ?? p.value ?? 0),
        reference: p.reference ?? null,
      }));

      const res = await completeOrder({
        items: cart,
        payments: normalizedPayments,
        subtotal: calculateSubtotal(),
        discount: orderDiscount,
        tax: calculateTax(),
        total: calculateTotal(),
        orderType, // <-- OrderType (correct)
        note: orderNote || undefined,
        pickupTime: null,
      });

      setCart([]);
      setOrderNote("");
      setOrderDiscount(0);
      setPaymentModalOpen(false);

      navigate(`/receipt/${res.id}`, { state: { autoPrint: printReceipt } });
    } catch (e: any) {
      console.error("❌ handlePayment error:", e);
      alert(e?.message ?? "Payment failed");
    }
  };

  const orderTypeButtons: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: "DINE_IN", label: "Dine In", icon: <Package size={18} /> },
    { type: "TAKEAWAY", label: "Takeaway", icon: <ShoppingCart size={18} /> },
    { type: "DELIVERY", label: "Delivery", icon: <Truck size={18} /> },
    { type: "PREORDER", label: "Preorder", icon: <Calendar size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <AppHeader
        shopName="Sweet Delights Bakery"
        cashierName={currentUser.name}
        sessionStatus={`Session ${currentSession.id.slice(-4)}`}
        connectionStatus={navigator.onLine ? "online" : "offline"}
        syncQueueCount={0}
        onSettingsClick={() => navigate("/settings")}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[70%] flex flex-col border-r border-[var(--color-border)]">
          <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={setActiveCategory} />

          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={handleAddProduct} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[30%] flex flex-col bg-white">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Current Order
              {cart.length > 0 && (
                <span className="text-sm text-[var(--color-text-secondary)]">
                  ({cart.length} {cart.length === 1 ? "item" : "items"})
                </span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
                <ShoppingCart size={48} className="mb-4 opacity-30" />
                <p>Cart is empty</p>
                <p className="text-sm mt-2">Add products to start</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  onEdit={handleEditItem}
                />
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-[var(--color-border)] p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Subtotal:</span>
                <span>${calculateSubtotal()?.toFixed(2)
}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Discount:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-24 px-2 py-1 text-right border border-[var(--color-border)] rounded"
                  value={orderDiscount || ""}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Tax (10%):</span>
                <span>${calculateTax()?.toFixed(2)
}</span>
              </div>

              <div className="flex justify-between text-xl pt-3 border-t border-[var(--color-border)]">
                <span>Total:</span>
                <span className="text-[var(--color-primary)]">${calculateTotal()?.toFixed(2)
}</span>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--color-border)] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {orderTypeButtons.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => setOrderType(btn.type)}
                  className={`
                    p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-sm
                    ${
                      orderType === btn.type
                        ? "border-[var(--color-primary)] bg-pink-50 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                    }
                  `}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => {}} disabled={cart.length === 0}>
                <Pause size={18} />
                Hold
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setPaymentModalOpen(true)}
                disabled={cart.length === 0}
              >
                Pay ${calculateTotal()?.toFixed(2)}

              </Button>
            </div>
          </div>
        </div>
      </div>

      <VariantModal
        isOpen={variantModalOpen}
        onClose={() => {
          setVariantModalOpen(false);
          setSelectedProduct(null);
          setEditingItem(null);
        }}
        product={selectedProduct}
        editItem={editingItem}
        onConfirm={handleConfirmItem}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalDue={calculateTotal()}
        onConfirm={handlePayment}
      />
    </div>
  );
};
