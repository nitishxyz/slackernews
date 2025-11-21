# Solana Kit Documentation Reference

This document contains key information from Solana Kit documentation for migrating from `@solana/web3.js` to `@solana/kit`.

## Overview

Solana Kit (`@solana/kit`) is the modern replacement for `@solana/web3.js`. It provides:
- Better TypeScript support
- More modular architecture
- Improved performance
- Modern async patterns

## Key Differences from web3.js

### 1. Transaction Creation

**Old (web3.js):**
```typescript
import { Transaction, SystemProgram } from '@solana/web3.js';

const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: receiver,
    lamports: amount
  })
);
```

**New (@solana/kit):**
```typescript
import { pipe, createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstructions, getTransactionEncoder } from '@solana/kit';

const transaction = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => new Uint8Array(getTransactionEncoder().encode(tx))
);
```

### 2. RPC Connection

**Old (web3.js):**
```typescript
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const { blockhash } = await connection.getLatestBlockhash();
```

**New (@solana/kit):**
```typescript
import { createSolanaRpc } from '@solana/kit';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const { value: { blockhash } } = await rpc.getLatestBlockhash().send();
```

### 3. Token Transfers (SPL Tokens)

**Old (web3.js + @solana/spl-token):**
```typescript
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const mint = new PublicKey('...');
const source = await getAssociatedTokenAddress(mint, sender);
const dest = await getAssociatedTokenAddress(mint, receiver);

const instruction = createTransferInstruction(
  source,
  dest,
  sender,
  amount
);
```

**New (@solana/kit):**
```typescript
import { getTransferSolInstruction } from '@solana-program/token';
import { address } from '@solana/kit';

const instruction = getTransferSolInstruction({
  source: address('source...'),
  destination: address('dest...'),
  authority: address('sender...'),
  amount: 1000000n
});
```

### 4. Serialization

**Old (web3.js):**
```typescript
// Partial signature
transaction.partialSign(keypair);
const serialized = transaction.serialize({ requireAllSignatures: false });
const base64 = serialized.toString('base64');

// Full signature
const fullSerialized = transaction.serialize();
```

**New (@solana/kit):**
```typescript
import { getTransactionEncoder } from '@solana/kit';

const encoder = getTransactionEncoder();
const bytes = encoder.encode(transactionMessage);
const base64 = Buffer.from(bytes).toString('base64');

// Signing is handled separately via signers
```

## Migration Strategy for SlackerNews

### Backend (packages/core/solana/index.ts)

We need to migrate:
1. ✅ Transaction creation using `createTransactionMessage` and `pipe`
2. ✅ RPC calls using `createSolanaRpc`
3. ✅ Token transfer instructions from `@solana-program/token`
4. ✅ Signing with platform keypair
5. ✅ Serialization to Uint8Array instead of Buffer

### Frontend (apps/frontend/src/routes/submit.tsx)

Already using Privy's Solana hooks which work with Uint8Array, so minimal changes needed.

## Important Notes

- **Addresses**: Use `address('...')` helper instead of `new PublicKey('...')`
- **Amounts**: Use `BigInt` (e.g., `1000000n`) instead of `number`
- **Async patterns**: All RPC calls return `.send()` method
- **Type safety**: Better TypeScript inference throughout
- **Modular imports**: Import only what you need from specific packages

## Packages Needed

```json
{
  "@solana/kit": "^5.0.0",
  "@solana-program/token": "^0.10.0",
  "@solana-program/system": "^0.10.0",
  "@solana-program/compute-budget": "^0.10.0"
}
```

## Resources

- Upgrade Guide: https://www.solanakit.com/docs/upgrade-guide
- Getting Started: https://www.solanakit.com/docs/getting-started
- Transactions: https://www.solanakit.com/docs/transactions
- Token Transfers: https://www.solanakit.com/docs/token-transfers
