import { TonClient, WalletContractV4, internal, beginCell, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

/**
 * Verifies the connection to the TON blockchain network via RPC.
 */
export async function verifyTonConnection() {
  const client = new TonClient({
    endpoint: process.env.TON_RPC_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TONCENTER_API_KEY,
  });

  try {
    const testAddress = Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
    const state = await client.getContractState(testAddress);
    return { connected: true, state: state.state };
  } catch (err: any) {
    console.error('[TON Check Error] Failed to connect to TON RPC:', err.message);
    return { connected: false, error: err.message };
  }
}

/**
 * Settles a market on-chain by sending a signed transaction to the pool smart contract.
 */
export async function settleMarketOnChain(poolAddress: string, winningOutcome: string) {
  const mnemonic = process.env.ORACLE_MNEMONIC;
  if (!mnemonic) {
    throw new Error('ORACLE_MNEMONIC environment variable is not configured on Render.');
  }

  const client = new TonClient({
    endpoint: process.env.TON_RPC_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TONCENTER_API_KEY,
  });

  // 1. Derive wallet keypair from mnemonic
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
  
  // 2. Initialize Wallet (using WalletV4 standard)
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const walletProvider = client.open(wallet);

  // 3. Check wallet balance to ensure it has funds for gas
  const seqno = await walletProvider.getSeqno();
  const balance = await walletProvider.getBalance();
  console.log(`[tonSettler] Oracle Wallet Balance: ${balance} nanotons | Current Seqno: ${seqno}`);

  if (balance <= 0n) {
    throw new Error('Oracle wallet has zero balance! Fund the wallet with testnet TON to pay for gas fees.');
  }

  // 4. Construct the payload body for your smart contract settlement
  // (Adjust the opcode and cell structure according to your specific FunC/Tact contract interface)
  const settlementPayload = beginCell()
    .storeUint(0x73657474, 32) // Example op code for 'settle' (or your contract's specific opcode)
    .storeRef(
      beginCell()
        .storeStringTail(winningOutcome)
        .endCell()
    )
    .endCell();

  // 5. Send the internal message to the target pool contract
  console.log(`[tonSettler] Broadcasting settlement transaction to pool: ${poolAddress}...`);
  
  await walletProvider.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: Address.parse(poolAddress),
        value: 50000000n, // 0.05 TON for gas
        bounce: true,
        body: settlementPayload,
      }),
    ],
  });

  console.log(`[tonSettler] Successfully broadcasted settlement transaction for pool ${poolAddress}`);
  return true;
}
