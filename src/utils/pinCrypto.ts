const ITERATIONS_DEFAULT = 120_000; // good balance for modern devices
const KEY_LENGTH_BITS = 256; // 32 bytes

function toBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function pbkdf2(pin: string, saltBytes: Uint8Array, iterations: number) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes.buffer as ArrayBuffer,
      iterations,
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return toBase64(bits);
}

export async function hashPin(pin: string, iterations = ITERATIONS_DEFAULT) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pinHash = await pbkdf2(pin, salt, iterations);
  return {
    pinHash,
    pinSalt: toBase64(salt.buffer),
    pinIter: iterations,
  };
}

export async function verifyPin(
  pin: string,
  pinHash: string,
  pinSalt: string,
  pinIter: number
) {
  const saltBytes = fromBase64(pinSalt);
  
  const computed = await pbkdf2(pin, saltBytes, pinIter);

  // constant-time-ish compare (good enough for local app)
  if (computed.length !== pinHash.length) return false;
  let ok = 0;
  for (let i = 0; i < computed.length; i++) {
    ok |= computed.charCodeAt(i) ^ pinHash.charCodeAt(i);
  }
  return ok === 0;
}
