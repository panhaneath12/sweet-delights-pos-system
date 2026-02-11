import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, UserCheck, UserX, ArrowLeft } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { getUsers, setUsers, getCurrentUser, getCurrentSession } from "../utils/storage";
import type { User, UserRole } from "../types";
import { hashPin } from "../lib/pinCrypto";
import { fetchUsersFromSupabase, upsertUserToSupabase, setUserActiveSupabase } from "../lib/adminUsers";

export const AdminCashiers: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentSession = getCurrentSession();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(""); // only for create OR changing pin
  const [role, setRole] = useState<UserRole>("CASHIER");
  const [active, setActive] = useState(true);

  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !currentSession) navigate("/");
  }, [currentUser, currentSession, navigate]);

  if (!currentUser || !currentSession) return null;

  if (currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            Access Denied. Admin privileges required.
          </p>
          <Button onClick={() => navigate("/pos")}>Back to POS</Button>
        </div>
      </div>
    );
  }

  // ✅ load remote -> overwrite local (only when online)
  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) return;
      try {
        setSyncError(null);
        const remote = await fetchUsersFromSupabase();
        setUsers(remote);
      } catch (e) {
        console.error("❌ load users failed:", e);
        setSyncError("Could not load users from cloud. Using local data.");
      }
    };
    load();
  }, []);

  const users = getUsers();

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setUsername(user.username);
      setPin(""); // leave empty; only fill if changing PIN
      setRole(user.role);
      setActive(user.active);
    } else {
      setEditingUser(null);
      setName("");
      setUsername("");
      setPin("");
      setRole("CASHIER");
      setActive(true);
    }
    setModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!name.trim() || !username.trim()) {
      alert("Please fill all required fields");
      return;
    }

    // For new user PIN is required; for edit it is optional (only if changing PIN)
    if (!editingUser && !pin.trim()) {
      alert("PIN is required for new user");
      return;
    }

    if (pin.trim()) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        alert("PIN must be exactly 4 digits");
        return;
      }
    }

    // Check duplicate username
    const existingUser = users.find((u) => u.username === username && u.id !== editingUser?.id);
    if (existingUser) {
      alert("Username already exists");
      return;
    }

    let pinHash = editingUser?.pinHash;
    let pinSalt = editingUser?.pinSalt;
    let pinIter = editingUser?.pinIter;

    // If PIN provided -> hash it
    if (pin.trim()) {
      const hashed = await hashPin(pin);
      pinHash = hashed.pinHash;
      pinSalt = hashed.pinSalt;
      pinIter = hashed.pinIter;
    }

    const savedUser: User = editingUser
      ? {
          ...editingUser,
          name: name.trim(),
          username: username.trim(),
          role,
          active,
          pinHash,
          pinSalt,
          pinIter,
        }
      : {
          id: crypto.randomUUID(),
          name: name.trim(),
          username: username.trim(),
          role,
          active,
          pinHash: pinHash!,
          pinSalt: pinSalt!,
          pinIter: pinIter!,
        };

    const allUsers = getUsers();
    const updated = editingUser
      ? allUsers.map((u) => (u.id === savedUser.id ? savedUser : u))
      : [...allUsers, savedUser];

    // local first
    setUsers(updated);
    setModalOpen(false);

    // sync
    try {
      if (navigator.onLine) await upsertUserToSupabase(savedUser);
    } catch (e) {
      console.error("❌ user sync failed:", e);
      setSyncError("Saved locally, but cloud sync failed (offline).");
    }
  };

  const handleToggleActive = async (userId: string) => {
    if (userId === currentUser.id) {
      alert("You cannot deactivate your own account");
      return;
    }

    const allUsers = getUsers();
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;

    const nextActive = !target.active;

    // local first
    const updated = allUsers.map((u) => (u.id === userId ? { ...u, active: nextActive } : u));
    setUsers(updated);

    // sync
    try {
      if (navigator.onLine) await setUserActiveSupabase(userId, nextActive);
    } catch (e) {
      console.error("❌ toggle active sync failed:", e);
      setSyncError("Updated locally, but cloud sync failed (offline).");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <AppHeader
        shopName="Sweet Delights Bakery"
        cashierName={currentUser.name}
        onSettingsClick={() => navigate("/settings")}
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/pos")}>
              <ArrowLeft size={18} />
              Back to POS
            </Button>
            <h2>Cashier Management</h2>
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {syncError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
            {syncError}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Name</th>
                <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Username</th>
                <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Role</th>
                <th className="px-6 py-3 text-left text-xs text-[var(--color-text-secondary)]">Status</th>
                <th className="px-6 py-3 text-right text-xs text-[var(--color-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                        <span className="text-[var(--color-primary-dark)]">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p>{user.name}</p>
                        {user.id === currentUser.id && (
                          <p className="text-xs text-[var(--color-text-secondary)]">(You)</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {user.username}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge variant={user.role === "ADMIN" ? "warning" : "info"}>
                      {user.role}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge variant={user.active ? "success" : "default"}>
                      {user.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="p-2 rounded hover:bg-gray-100 inline-flex items-center justify-center mr-2"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`p-2 rounded inline-flex items-center justify-center ${
                        user.active ? "hover:bg-red-100 text-[var(--color-error)]" : "hover:bg-green-100 text-green-600"
                      }`}
                      title={user.active ? "Deactivate" : "Activate"}
                      disabled={user.id === currentUser.id}
                    >
                      {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
          <Input
            label="Username *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />

          <Input
            label={editingUser ? "New PIN (optional)" : "PIN (4 digits) *"}
            type="text"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            helperText={editingUser ? "Leave empty to keep current PIN" : "4-digit PIN for login"}
          />

          <div>
            <label className="block mb-2 text-sm">Role *</label>
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="userActive"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="userActive" className="text-sm cursor-pointer">
              Active (can login)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleSaveUser}>
              {editingUser ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
