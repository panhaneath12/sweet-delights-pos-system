import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Clock } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import {
  getSessions,
  setSessions,
  getCurrentUser,
  setCurrentSession,
} from "../utils/storage";
import type { CashSession } from "../types";
import { upsertCashSessionToSupabase } from "../lib/cashSessions";

export const OpenCashSession: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [openingAmount, setOpeningAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) navigate("/");
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const sessions = getSessions();

  const lastSession = useMemo(() => {
    return sessions
      .filter((s) => s.userId === currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      )[0];
  }, [sessions, currentUser.id]);

  const handleOpenSession = async () => {
    if (isSaving) return;

    const amount = parseFloat(openingAmount);

    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    setIsSaving(true);

    const newSession: CashSession = {
      id: crypto.randomUUID(), // ✅ UUID so it matches DB uuid + FK
      userId: currentUser.id,
      openedAt: new Date().toISOString(),
      openingAmount: amount,
      note: note.trim() ? note.trim() : undefined,
      status: "OPEN",
    };

    // ✅ always save locally first (offline-first)
    const allSessions = getSessions();
    allSessions.push(newSession);
    setSessions(allSessions);
    setCurrentSession(newSession);

    // ✅ then try to sync to Supabase (so orders.session_id FK passes)
    try {
      if (navigator.onLine) {
        await upsertCashSessionToSupabase(newSession);
      }
    } catch (err) {
      console.error("❌ cash session sync failed (will retry later):", err);
      // Optional: show a message but still allow POS to open
      // setError("Opened locally, but couldn't sync to cloud (offline).");
    } finally {
      setIsSaving(false);
    }

    navigate("/pos");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-2">Open Cash Session</h1>
          <p className="text-[var(--color-text-secondary)]">
            Welcome back, {currentUser.name}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Last Session Summary */}
          {lastSession && (
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6">
              <h3 className="mb-4 text-[var(--color-text-secondary)]">
                Last Session
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                  <Clock size={18} />
                  <div>
                    <p className="text-xs">Opened</p>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      {formatDateTime(lastSession.openedAt)}
                    </p>
                  </div>
                </div>

                {lastSession.closedAt && (
                  <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <Clock size={18} />
                    <div>
                      <p className="text-xs">Closed</p>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {formatDateTime(lastSession.closedAt)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                  <DollarSign size={18} />
                  <div>
                    <p className="text-xs">Opening Amount</p>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      ${lastSession.openingAmount?.toFixed(2)
}
                    </p>
                  </div>
                </div>

                {lastSession.closingAmount !== undefined && (
                  <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <DollarSign size={18} />
                    <div>
                      <p className="text-xs">Closing Amount</p>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        ${lastSession.closingAmount?.toFixed(2)
}
                      </p>
                    </div>
                  </div>
                )}

                {lastSession.note && (
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                      Note
                    </p>
                    <p className="text-sm italic">{lastSession.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Open New Session Form */}
          <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6">
            <h3 className="mb-6">New Session</h3>

            <div className="space-y-4">
              <Input
                label="Opening Cash Amount *"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => {
                  setOpeningAmount(e.target.value);
                  setError("");
                }}
                error={error}
              />

              <div>
                <label className="block mb-2 text-sm">Note (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                  rows={3}
                  placeholder="Add any notes about this session..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleOpenSession}
                  disabled={isSaving}
                >
                  <DollarSign size={20} />
                  {isSaving ? "Opening..." : "Open Session"}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => navigate("/")}
                disabled={isSaving}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
