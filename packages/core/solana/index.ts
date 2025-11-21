import { 
 createSolanaRpc,
 address,
 pipe,
 createTransactionMessage,
 setTransactionMessageFeePayerSigner,
 setTransactionMessageLifetimeUsingBlockhash,
 appendTransactionMessageInstructions,
 getTransactionEncoder,
 signTransactionMessageWithSigners,
 getSignatureFromTransaction,
 type Address,
 type TransactionSigner
} from "@solana/kit";
import { createKeyPairSignerFromBytes, createKeyPairSignerFromPrivateKeyBytes } from "@solana/signers";
import {
  getTransferCheckedInstruction,
  type TransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
 getCreateAssociatedTokenInstructionAsync
} from "@solana-program/token";
import { Resource } from "sst";
import bs58 from "bs58";

const USDC_MINT_MAINNET = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_MINT_DEVNET = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

const IS_PROD = process.env.SST_STAGE === "production";
export const USDC_MINT = IS_PROD ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;

export const COSTS = {
  POST: 20000n,
  COMMENT: 5000n,
  UPVOTE: 1000n
};

export const REVENUE_SHARE = {
  AUTHOR: 0.8,
  PLATFORM: 0.2
};

const getPlatformSigner = async (): Promise<TransactionSigner> => {
 if (!Resource.PlatformSigner?.value) {
   const error = new Error("PlatformSigner secret is missing. Please configure SST secrets.");
   console.error("Missing PlatformSigner:", error);
   throw error;
 }
 const secretKey = bs58.decode(Resource.PlatformSigner.value);
  
  // Check if this is a 64-byte keypair or 32-byte private key
  const signer = secretKey.length === 64 
    ? await createKeyPairSignerFromBytes(secretKey)
    : await createKeyPairSignerFromPrivateKeyBytes(secretKey);
  
 console.log("Platform signer loaded successfully");
  console.log("Platform signer address:", signer.address);
 return signer;
};

const getRpc = () => {
 if (!Resource.HeliusRpcUrl?.value) {
    const error = new Error("HeliusRpcUrl secret is missing. Please configure SST secrets.");
    console.error("Missing HeliusRpcUrl:", error);
    throw error;
 }
  console.log("RPC URL:", Resource.HeliusRpcUrl.value);
 return createSolanaRpc(Resource.HeliusRpcUrl.value);
};

async function getOrCreateATAInstruction(
  payer: Address,
  mint: Address,
  owner: Address,
  instructions: any[]
) {
  const rpc = getRpc();
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner,
    tokenProgram: TOKEN_PROGRAM_ADDRESS
  });

  try {
    const accountInfo = await rpc.getAccountInfo(ata, { encoding: 'base64' }).send();
    if (!accountInfo.value) {
      const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
        payer,
        ata,
        owner,
        mint,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
      });
      instructions.push(createAtaIx);
    }
  } catch (error) {
    const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
      payer,
      ata,
      owner,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS
    });
    instructions.push(createAtaIx);
  }

  return ata;
}

export async function createPostTransaction(userPublicKeyStr: string) {
  console.log("createPostTransaction called with address:", userPublicKeyStr);
  
  if (!userPublicKeyStr) {
    throw new Error("User address is required");
  }
  
 const rpc = getRpc();
  const platformSigner = await getPlatformSigner();
 
 console.log("Platform signer address:", platformSigner.address);
  
 const userAddress = address(userPublicKeyStr);
  console.log("User address parsed:", userAddress);
  
  const instructions: any[] = [];

  const [userATA] = await findAssociatedTokenPda({
    mint: USDC_MINT,
    owner: userAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS
  });

  console.log("Checking user ATA:", userATA);
  const userATAInfo = await rpc.getAccountInfo(userATA, { encoding: 'jsonParsed' }).send();
  
  if (!userATAInfo.value) {
    console.error(`User ATA ${userATA} does not exist for owner ${userAddress} and mint ${USDC_MINT}`);
    throw new Error("User has no USDC account. Please fund your wallet with Devnet USDC.");
  }

  const tokenProgramId = userATAInfo.value.owner;
  console.log("User ATA Program ID:", tokenProgramId);

  const parsedInfo = (userATAInfo.value.data as any)?.parsed?.info;
  if (parsedInfo) {
    console.log("ATA Owner on chain:", parsedInfo.owner);
    console.log("Expected Owner:", userAddress);
    if (parsedInfo.owner !== userAddress) {
      throw new Error(`ATA Owner Mismatch. Chain: ${parsedInfo.owner}, Request: ${userAddress}`);
    }
  }

  const platformATA = await getOrCreateATAInstruction(
    platformSigner.address,
    USDC_MINT,
    platformSigner.address,
    instructions
  );

  // Fetch mint info to get decimals
  const mintAccountInfo = await rpc.getAccountInfo(USDC_MINT, { encoding: 'jsonParsed' }).send();
  if (!mintAccountInfo.value) {
    throw new Error(`Mint account ${USDC_MINT} not found`);
  }
  const decimals = (mintAccountInfo.value.data as any)?.parsed?.info?.decimals;
  if (typeof decimals !== 'number') {
    throw new Error(`Could not fetch decimals for mint ${USDC_MINT}`);
  }
  console.log("Mint Decimals:", decimals);
  console.log("Creating TransferChecked Instruction with:");
  console.log("Source:", userATA);
  console.log("Dest:", platformATA);
  console.log("Owner:", userAddress);
  console.log("Mint:", USDC_MINT);

  instructions.push(
    getTransferCheckedInstruction({
      source: userATA,
      destination: platformATA,
      owner: userAddress,
      amount: COSTS.POST,
      decimals: decimals,
      mint: USDC_MINT,
      tokenProgram: tokenProgramId as Address
    })
  );

 const { value: { blockhash, lastValidBlockHeight } } = await rpc.getLatestBlockhash().send();

 const transactionMessage = pipe(
   createTransactionMessage({ version: 0 }),
   (tx) => setTransactionMessageFeePayerSigner(platformSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash({ blockhash, lastValidBlockHeight }, tx),
   (tx) => appendTransactionMessageInstructions(instructions, tx)
 );

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);

  const encoder = getTransactionEncoder();
  const bytes = encoder.encode(signedTransaction);
  
  return Buffer.from(bytes).toString("base64");
}

export async function createInteractionTransaction(
  userPublicKeyStr: string, 
  authorPublicKeyStr: string,
  type: "COMMENT" | "UPVOTE"
) {
 const rpc = getRpc();
  const platformSigner = await getPlatformSigner();
 const userAddress = address(userPublicKeyStr);
  const authorAddress = address(authorPublicKeyStr);

  const cost = type === "COMMENT" ? COSTS.COMMENT : COSTS.UPVOTE;
  const authorShare = (cost * BigInt(Math.floor(REVENUE_SHARE.AUTHOR * 100))) / 100n;
  const platformShare = cost - authorShare;

  const instructions: any[] = [];

  const [userATA] = await findAssociatedTokenPda({
    mint: USDC_MINT,
    owner: userAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS
  });

  // Fetch mint info to get decimals
  const mintAccountInfo = await rpc.getAccountInfo(USDC_MINT, { encoding: 'jsonParsed' }).send();
  if (!mintAccountInfo.value) {
    throw new Error(`Mint account ${USDC_MINT} not found`);
  }
  const decimals = (mintAccountInfo.value.data as any)?.parsed?.info?.decimals;
  if (typeof decimals !== 'number') {
    throw new Error(`Could not fetch decimals for mint ${USDC_MINT}`);
  }

  const authorATA = await getOrCreateATAInstruction(
    platformSigner.address,
    USDC_MINT,
    authorAddress,
    instructions
  );

  const platformATA = await getOrCreateATAInstruction(
    platformSigner.address,
    USDC_MINT,
    platformSigner.address,
    instructions
  );

 if (authorShare > 0n) {
   instructions.push(
      getTransferCheckedInstruction({
       source: userATA,
       destination: authorATA,
        owner: userAddress,
       amount: authorShare,
       decimals: decimals,
       mint: USDC_MINT,
     })
   );
 }

 if (platformShare > 0n) {
   instructions.push(
      getTransferCheckedInstruction({
       source: userATA,
       destination: platformATA,
        owner: userAddress,
       amount: platformShare,
       decimals: decimals,
       mint: USDC_MINT,
     })
   );
 }

 const { value: { blockhash } } = await rpc.getLatestBlockhash().send();

 const transactionMessage = pipe(
   createTransactionMessage({ version: 0 }),
   (tx) => setTransactionMessageFeePayerSigner(platformSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash({ blockhash }, tx),
   (tx) => appendTransactionMessageInstructions(instructions, tx)
 );

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);

  const encoder = getTransactionEncoder();
  const bytes = encoder.encode(signedTransaction);
  
  return Buffer.from(bytes).toString("base64");
}

export async function submitSignedTransaction(signedTxBase64: string) {
  const rpc = getRpc();
  
  const signature = await rpc.sendTransaction(signedTxBase64, { encoding: 'base64' }).send();
  
  const confirmation = await rpc.confirmTransaction(signature, { commitment: 'confirmed' }).send();
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }
  
  return signature;
}
