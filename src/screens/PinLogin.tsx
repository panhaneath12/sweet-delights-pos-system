import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Wifi, WifiOff } from "lucide-react";
import { Button } from "../components/Button";
import type { User as UserType } from "../types";
import { supabase } from "../lib/supabase";
import { hashPin, verifyPin } from "../utils/pinCrypto";
import {
  isLocked,
  lockMessage,
  recordFail,
  recordSuccess,
} from "../utils/pinLock";
import {
  getUsers,
  setUsers,
  setCurrentUser,
  getDeviceName,
} from "../utils/storage";

export const PinLogin: React.FC = () => {
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);

  // Load users once (active only for UI)
  const users = useMemo(() => getUsers().filter((u) => u.active), []);
  const deviceName = getDeviceName();

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const handlePinInput = (digit: string) => {
    if (isLoading) return;
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError("");
    }
  };

  const handleClear = () => {
    if (isLoading) return;
    setPin("");
    setError("");
  };

  const canSubmit = !!selectedUser && pin.length === 4 && !isLoading;

  const validate = () => {
    if (!selectedUser) {
      setError("Please select a user");
      return false;
    }
    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return false;
    }
    return true;
  };

  /**
   * ONLINE login:
   * - Uses Supabase Auth for verification
   * - On success, we generate and store pinHash locally for offline login
   */
  const loginOnlineAndProvisionOffline = async (
    user: UserType,
    pinCode: string
  ) => {
    const email = `${user.username}@pos.local`;
    const password = pinCode;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Provision/update offline hash for this device
    const { pinHash, pinSalt, pinIter } = await hashPin(pinCode);

    const allUsers = getUsers();
    const updatedUsers = allUsers.map((u) =>
      u.id === user.id ? { ...u, pinHash, pinSalt, pinIter } : u
    );
    setUsers(updatedUsers);

    // Store current user locally (so POS can work offline)
    setCurrentUser({ ...user, pinHash, pinSalt, pinIter } as UserType);

    return data.user;
  };

  /**
   * OFFLINE login:
   * - Uses stored pinHash (no plaintext PIN)
   * - Requires the user to have been provisioned at least once online
   */
  const loginOfflineWithHash = async (user: UserType, pinCode: string) => {
    if (!user.pinHash || !user.pinSalt || !user.pinIter) {
      throw new Error(
        "Offline login not available for this user yet. Please login once online first."
      );
    }

    const ok = await verifyPin(pinCode, user.pinHash, user.pinSalt, user.pinIter);
    if (!ok) throw new Error("Incorrect PIN");

    setCurrentUser(user);
  };

  const handleLogin = async () => {
    setError("");
    if (!validate() || !selectedUser) return;

    if (isLocked(selectedUser.id)) {
      setError(lockMessage(selectedUser.id));
      setPin("");
      return;
    }

    setIsLoading(true);

    try {
      // ONLINE first (best): verify with Supabase, provision offline hash
      if (navigator.onLine) {
        await loginOnlineAndProvisionOffline(selectedUser, pin);
        recordSuccess(selectedUser.id);
        navigate("/open-session");
        return;
      }

      // OFFLINE: verify using stored hash
      await loginOfflineWithHash(selectedUser, pin);
      recordSuccess(selectedUser.id);
      navigate("/open-session");
    } catch (e: any) {
      recordFail(selectedUser.id);
      setError(e?.message ?? "Login failed");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary)] rounded-full mb-4">
            <span className="text-4xl">🧁</span>
          </div>
          <h1 className="text-[var(--color-primary)] mb-2">
            Sweet Delights Bakery
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Point of Sale System
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8">
          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm mb-3">Select Cashier</label>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    if (isLoading) return;
                    setSelectedUser(user);
                    setPin("");
                    setError("");
                  }}
                  className={`
                    w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all
                    ${
                      selectedUser?.id === user.id
                        ? "border-[var(--color-primary)] bg-pink-50"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                    }
                  `}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <User
                      size={20}
                      className="text-[var(--color-primary-dark)]"
                    />
                  </div>
                  <div className="text-left">
                    <p>{user.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {user.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PIN Input */}
          <div className="mb-6">
            <label className="block text-sm mb-3">Enter PIN</label>
            <div className="flex items-center justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`
                    w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl
                    ${
                      pin.length > i
                        ? "border-[var(--color-primary)] bg-pink-50"
                        : "border-[var(--color-border)]"
                    }
                  `}
                >
                  {pin.length > i ? "●" : ""}
                </div>
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinInput(num.toString())}
                  disabled={isLoading}
                  className="p-4 text-xl rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handleClear}
                disabled={isLoading}
                className="p-4 text-lg rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-[var(--color-error)] disabled:opacity-50"
              >
                Clear
              </button>

              <button
                onClick={() => handlePinInput("0")}
                disabled={isLoading}
                className="p-4 text-xl rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
              >
                0
              </button>

              <button
                onClick={handleLogin}
                disabled={!canSubmit}
                className="p-4 text-lg rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={isLoading ? "Signing in..." : "Login"}
              >
                {isLoading ? "…" : "✓"}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Login Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleLogin}
            disabled={!canSubmit}
          >
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] flex items-center justify-center gap-4">
          <span>{deviceName}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi size={14} className="text-green-600" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-orange-600" />
                <span>Offline</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
