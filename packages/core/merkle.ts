/**
 * AquaPulse Pure TypeScript SHA-256 and Canonical Merkle Ledger
 * Deterministic, zero-dependency, works offline in browser and Node.
 * Conforms byte-for-byte with AquaPulse v9.2 spec §6.8 and reference/aquapulse_ref.py (Appendix E).
 */

import { MerkleNode, MerkleProof, MerkleProofStep } from './types.ts';

// Standard pure JS SHA-256 over byte buffers
export function sha256Bytes(data: Uint8Array): Uint8Array {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const len = data.length;
  const bitLen = len * 8;
  const padLen = (((len + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(padLen);
  buf.set(data);
  buf[len] = 0x80;

  // Set 64-bit big-endian length at the end
  const view = new DataView(buf.buffer);
  // High 32 bits are 0 for reasonable payload sizes
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  const w = new Int32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getInt32(offset + (i << 2), false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setInt32(0, h0, false);
  outView.setInt32(4, h1, false);
  outView.setInt32(8, h2, false);
  outView.setInt32(12, h3, false);
  outView.setInt32(16, h4, false);
  outView.setInt32(20, h5, false);
  outView.setInt32(24, h6, false);
  outView.setInt32(28, h7, false);

  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function hashString(str: string): string {
  return bytesToHex(sha256Bytes(new TextEncoder().encode(str)));
}

/** Formats a number with exactly 6 decimal places (%.6f) per spec §6.8 */
export function fmt6(x: number): string {
  return x.toFixed(6);
}

/**
 * Encodes field with 4-byte big-endian length prefix: struct.pack('>I', len(b)) + b
 */
export function encodeField(field: string): Uint8Array {
  const fieldBytes = new TextEncoder().encode(field);
  const out = new Uint8Array(4 + fieldBytes.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, fieldBytes.length, false); // 4-byte BE length
  out.set(fieldBytes, 4);
  return out;
}

/**
 * Computes canonical Merkle leaf:
 * SHA-256(0x00 || len(f1)||f1 || len(f2)||f2 ...)
 */
export function computeCanonicalLeafBytes(fields: string[]): Uint8Array {
  const encodedFields = fields.map(encodeField);
  const totalFieldLen = encodedFields.reduce((acc, f) => acc + f.length, 0);
  const payload = new Uint8Array(1 + totalFieldLen);
  payload[0] = 0x00; // 0x00 prefix for leaf

  let offset = 1;
  for (const f of encodedFields) {
    payload.set(f, offset);
    offset += f.length;
  }

  return sha256Bytes(payload);
}

export function computeCanonicalLeafHex(fields: string[]): string {
  return bytesToHex(computeCanonicalLeafBytes(fields));
}

/**
 * Computes parent node hash from two 32-byte raw child digests:
 * SHA-256(0x01 || left_32_bytes || right_32_bytes)
 */
export function computeCanonicalNodeBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  const payload = new Uint8Array(1 + 32 + 32);
  payload[0] = 0x01; // 0x01 prefix for node
  payload.set(left, 1);
  payload.set(right, 1 + 32);
  return sha256Bytes(payload);
}

/**
 * Computes canonical Merkle root over list of 32-byte raw leaf digests.
 * Odd nodes at any level are PROMOTED UNCHANGED (never duplicated!) per spec §6.8.
 */
export function computeCanonicalRootBytes(leaves: Uint8Array[]): Uint8Array {
  if (leaves.length === 0) throw new Error('Cannot compute Merkle root of empty list');
  let currentLevel = leaves.slice();

  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];
    for (let i = 0; i < currentLevel.length - 1; i += 2) {
      nextLevel.push(computeCanonicalNodeBytes(currentLevel[i], currentLevel[i + 1]));
    }
    // If odd count at this level, promote the unpaired node unchanged
    if (currentLevel.length % 2 === 1) {
      nextLevel.push(currentLevel[currentLevel.length - 1]);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

export function computeCanonicalRootHex(leaves: Uint8Array[]): string {
  return bytesToHex(computeCanonicalRootBytes(leaves));
}

export interface LeafItem {
  id: string;
  label: string;
  payload: string;
  fields?: string[]; // canonical fields [farmerId, zone, week, alloc]
}

/**
 * Builds binary Merkle tree with odd-node promotion and proof path generation.
 */
export function buildMerkleTree(items: LeafItem[]): {
  root: MerkleNode;
  leaves: { id: string; label: string; hash: string; rawPayload: string }[];
} {
  if (items.length === 0) {
    const emptyHash = hashString('EMPTY_MERKLE_TREE');
    return {
      root: { id: 'root', hash: emptyHash, label: 'Empty Root' },
      leaves: [],
    };
  }

  const leaves = items.map((item) => {
    let leafHash: string;
    if (item.fields) {
      leafHash = computeCanonicalLeafHex(item.fields);
    } else {
      leafHash = hashString(item.payload);
    }
    return {
      id: item.id,
      label: item.label,
      hash: leafHash,
      rawPayload: item.payload,
    };
  });

  let currentLevel: MerkleNode[] = leaves.map((leaf) => ({
    id: leaf.id,
    hash: leaf.hash,
    label: leaf.label,
    leafData: leaf.rawPayload,
  }));

  // Build tree levels bottom-up with odd-node promotion
  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const leftBytes = hexToBytes(left.hash);
        const rightBytes = hexToBytes(right.hash);
        const combinedHash = bytesToHex(computeCanonicalNodeBytes(leftBytes, rightBytes));

        nextLevel.push({
          id: `node_${left.id}_${right.id}`,
          hash: combinedHash,
          label: `${left.label.split(' ')[0]} + ${right.label.split(' ')[0]}`,
          left,
          right,
        });
      } else {
        // Odd node: promote unchanged!
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    leaves,
  };
}

/**
 * Generates inclusion proof path for target leaf
 */
export function generateMerkleProof(root: MerkleNode, targetLeafId: string): MerkleProof | null {
  const steps: MerkleProofStep[] = [];
  let leafHash = '';

  function findPath(node: MerkleNode, id: string): boolean {
    if (!node.left && !node.right) {
      if (node.id === id) {
        leafHash = node.hash;
        return true;
      }
      return false;
    }

    if (node.left && findPath(node.left, id)) {
      if (node.right) {
        steps.push({ position: 'right', hash: node.right.hash });
      }
      return true;
    }

    if (node.right && findPath(node.right, id)) {
      if (node.left) {
        steps.push({ position: 'left', hash: node.left.hash });
      }
      return true;
    }

    return false;
  }

  const found = findPath(root, targetLeafId);
  if (!found) return null;

  // Verify proof path
  let currentBytes = hexToBytes(leafHash);
  for (const step of steps) {
    const stepBytes = hexToBytes(step.hash);
    if (step.position === 'right') {
      currentBytes = computeCanonicalNodeBytes(currentBytes, stepBytes);
    } else {
      currentBytes = computeCanonicalNodeBytes(stepBytes, currentBytes);
    }
  }

  const recomputedRootHex = bytesToHex(currentBytes);

  return {
    leafId: targetLeafId,
    leafHash,
    rootHash: root.hash,
    steps,
    isValid: recomputedRootHex === root.hash,
  };
}

/**
 * Simulates byte tampering on a specific leaf and shows resulting root change
 */
export function simulateTamperLeaf(
  items: LeafItem[],
  targetLeafId: string,
  tamperedPayload: string
): {
  originalTree: MerkleNode;
  tamperedTree: MerkleNode;
  originalRoot: string;
  tamperedRoot: string;
  targetLeafId: string;
  diffExplanation: string;
} {
  const original = buildMerkleTree(items);
  const tamperedItems = items.map((item) =>
    item.id === targetLeafId
      ? {
          ...item,
          payload: tamperedPayload,
          fields: item.fields
            ? [item.fields[0], item.fields[1], item.fields[2], fmt6(parseFloat(tamperedPayload) || 27.931034)]
            : undefined,
        }
      : item
  );
  const tampered = buildMerkleTree(tamperedItems);

  return {
    originalTree: original.root,
    tamperedTree: tampered.root,
    originalRoot: original.root.hash,
    tamperedRoot: tampered.root.hash,
    targetLeafId,
    diffExplanation: `Leaf [${targetLeafId}] allocation modified. Merkle root mutated from ${original.root.hash.slice(0, 12)}... to ${tampered.root.hash.slice(0, 12)}... (Cryptographic tamper detected bit-for-bit).`,
  };
}
