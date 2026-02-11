type LockState = {
  fails: number;
  lockedUntil?: number; // epoch ms
};

const KEY = "pos_pin_lock_v1";
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

function readAll(): Record<string, LockState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, LockState>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getLock(userId: string): LockState {
  const all = readAll();
  return all[userId] || { fails: 0 };
}

export function isLocked(userId: string) {
  const s = getLock(userId);
  return !!s.lockedUntil && Date.now() < s.lockedUntil;
}

export function recordFail(userId: string) {
  const all = readAll();
  const s = all[userId] || { fails: 0 };
  s.fails += 1;

  if (s.fails >= MAX_FAILS) {
    s.lockedUntil = Date.now() + LOCK_MS;
    s.fails = 0; // reset after locking
  }

  all[userId] = s;
  writeAll(all);
}

export function recordSuccess(userId: string) {
  const all = readAll();
  all[userId] = { fails: 0 };
  writeAll(all);
}

export function lockMessage(userId: string) {
  const s = getLock(userId);
  if (!s.lockedUntil) return "";
  const remainingMs = Math.max(0, s.lockedUntil - Date.now());
  const mins = Math.ceil(remainingMs / 60000);
  return `Too many attempts. Try again in ${mins} minute(s).`;
}
