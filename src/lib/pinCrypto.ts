function toBase64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function randomSalt(bytes = 16) {
  const salt = new Uint8Array(bytes);
  crypto.getRandomValues(salt);
  return salt;
}

export async function hashPin(pin: string, iter = 120000) {
  const enc = new TextEncoder();

  const salt = randomSalt();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: iter,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return {
    pinHash: toBase64(bits),
    pinSalt: toBase64(salt.buffer),
    pinIter: iter,
  };
}
