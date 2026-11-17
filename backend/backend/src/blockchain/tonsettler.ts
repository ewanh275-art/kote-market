import { TonClient, WalletContractV4, internal, beginCell, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

export async function settleMarketOnChain(poolAddress: string, outcome: boolean) {
  const client = new TonClient({
    endpoint: process.env.TON_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC',
  });

  const mnemonic = (process.env.ORACLE_MNEMONIC || '').split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const contract = client.open(wallet);

  const seqno = await contract.getSeqno();

  // Build ResolveMarket message payload
  const body = beginCell()
    .storeUint(0x4b4f5445, 32) // Opcode (match generated ABI)
    .storeBit(outcome)
    .endCell();

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: Address.parse(poolAddress),
        value: '0.05',
        body,
      }),
    ],
  });

  console.log(`[TON SETTLER] Market ${poolAddress} resolved to ${outcome ? 'YES' : 'NO'}`);
}
