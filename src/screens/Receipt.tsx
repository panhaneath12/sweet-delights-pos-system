// src/screens/Receipt.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { getOrders, getUsers, setOrders } from "../utils/storage";

export const Receipt: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation() as any;
  const [printed, setPrinted] = useState(false);

  const order = useMemo(() => getOrders().find((o) => o.id === orderId), [orderId]);
  const cashier = useMemo(() => (order ? getUsers().find((u) => u.id === order.cashierId) : null), [order]);

  const autoPrint = !!location?.state?.autoPrint;

  useEffect(() => {
    if (autoPrint && order && !printed) {
      setTimeout(() => handlePrint(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, order?.id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">Order not found</p>
          <Button onClick={() => navigate("/pos")}>Back to POS</Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    // mark printed time locally (optional)
    const now = new Date().toISOString();
    const updated = getOrders().map((o) => (o.id === order.id ? { ...o, printedAt: now } : o));
    setOrders(updated);

    window.print();
    setPrinted(true);
  };

  const fmt = (n: number) => `$${Number(n ?? 0)?.toFixed(2)
}`;

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const paidTotal = order.payments?.reduce((s, p) => s + (p.amount || 0), 0) ?? 0;
  const change = Math.max(0, paidTotal - order.total);

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .receipt-wrap { box-shadow: none !important; margin: 0 !important; }
          .receipt-paper { width: 80mm !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* actions */}
        <div className="no-print flex gap-3 mb-4">
          <Button variant="ghost" onClick={() => navigate("/pos")}>
            <ArrowLeft size={18} />
            Back
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={18} />
            {printed ? "Print Again" : "Print"}
          </Button>
        </div>

        {/* RECEIPT */}
        <div className="receipt-wrap bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="receipt-paper mx-auto p-4 font-mono text-[12px] leading-5">
            <div className="text-center">
              <div className="text-lg font-bold">SWEET DELIGHTS BAKERY</div>
              <div>Phnom Penh, Cambodia</div>
              <div>Tel: 012-345-678</div>
              <div className="my-2 border-t border-dashed border-gray-400" />
            </div>

            <div className="flex justify-between">
              <span>Receipt:</span>
              <span>{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashier?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{String(order.orderType).replace("_", " ")}</span>
            </div>

            <div className="my-2 border-t border-dashed border-gray-400" />

            {/* Items */}
            {order.items.map((it, idx) => {
              const unit = it.quantity ? it.lineTotal / it.quantity : it.lineTotal;
              return (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {it.quantity}x {it.productName}
                    </span>
                    <span>{fmt(it.lineTotal)}</span>
                  </div>

                  {it.variants?.length > 0 && (
                    <div className="text-gray-600">
                      {it.variants.map((v) => v.name).join(", ")}
                    </div>
                  )}

                  <div className="text-gray-600">
                    {fmt(unit)} each
                    {it.lineDiscount ? `  (-${fmt(it.lineDiscount)})` : ""}
                  </div>

                  {it.note ? <div className="text-gray-600">Note: {it.note}</div> : null}
                </div>
              );
            })}

            <div className="my-2 border-t border-dashed border-gray-400" />

            {/* Totals */}
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{fmt(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-[14px] mt-1">
              <span>TOTAL</span>
              <span>{fmt(order.total)}</span>
            </div>

            <div className="my-2 border-t border-dashed border-gray-400" />

            {/* Payments */}
            <div className="font-bold mb-1">Payments</div>
            {order.payments?.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {p.method}
                  {p.reference ? ` (${p.reference})` : ""}
                </span>
                <span>{fmt(p.amount)}</span>
              </div>
            ))}

            <div className="flex justify-between mt-1">
              <span>Paid</span>
              <span>{fmt(paidTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{fmt(change)}</span>
            </div>

            <div className="my-2 border-t border-dashed border-gray-400" />

            <div className="text-center">
              <div className="font-bold">Thank you!</div>
              <div>Please come again 🧁</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
