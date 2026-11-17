import "@stdlib/deploy";
import "@stdlib/ownable";

// Standard TON Jetton Transfer Notification (0x7362d09c)
message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

// Standard TON Jetton Transfer Outbound (0xf8a7ea5)
message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message ResolveMarket {
    outcome: Bool; // true = YES won, false = NO won
}

message ClaimWinnings {}

contract PredictionPool with Deployable, Ownable {
    owner: Address;
    oracle: Address;
    poolJettonWallet: Address;
    
    isResolved: Bool = false;
    winningOutcome: Bool = false;

    yesPool: Int as coins = 100000000000; // Initial virtual liquidity (100 GRAM)
    noPool: Int as coins = 100000000000;
    
    yesShares: map<Address, Int as coins>;
    noShares: map<Address, Int as coins>;

    init(owner: Address, oracle: Address, poolJettonWallet: Address) {
        self.owner = owner;
        self.oracle = oracle;
        self.poolJettonWallet = poolJettonWallet;
    }

    // Receive $GRAM Jetton wager
    receive(msg: JettonNotification) {
        require(sender() == self.poolJettonWallet, "Invalid Jetton");
        require(!self.isResolved, "Market already ended");
        require(msg.amount > 0, "Zero wager");

        // Read 1-bit side from forwardPayload (1 = YES, 0 = NO)
        let side: Bool = msg.forwardPayload.loadBit();
        let fee: Int = (msg.amount * 2) / 100; // 2% platform fee
        let netAmount: Int = msg.amount - fee;

        // Constant Product AMM Pricing (x * y = k)
        let k: Int = self.yesPool * self.noPool;
        if (side) {
            let newNoPool: Int = self.noPool + netAmount;
            let newYesPool: Int = k / newNoPool;
            let sharesOut: Int = (self.yesPool - newYesPool) + netAmount;
            self.noPool = newNoPool;
            self.yesPool = newYesPool;

            let prev: Int? = self.yesShares.get(msg.sender);
            self.yesShares.set(msg.sender, (prev != null ? prev!! : 0) + sharesOut);
        } else {
            let newYesPool: Int = self.yesPool + netAmount;
            let newNoPool: Int = k / newYesPool;
            let sharesOut: Int = (self.noPool - newNoPool) + netAmount;
            self.yesPool = newYesPool;
            self.noPool = newNoPool;

            let prev: Int? = self.noShares.get(msg.sender);
            self.noShares.set(msg.sender, (prev != null ? prev!! : 0) + sharesOut);
        }
    }

    // Triggered in real-time by your Render backend oracle when match/event ends
    receive(msg: ResolveMarket) {
        require(sender() == self.oracle, "Only Oracle can settle");
        require(!self.isResolved, "Already resolved");
        self.isResolved = true;
        self.winningOutcome = msg.outcome;
    }

    // Winners claim $GRAM payouts
    receive(msg: ClaimWinnings) {
        require(self.isResolved, "Market still live");
        let user: Address = sender();
        let payout: Int = 0;

        if (self.winningOutcome) {
            let shares: Int? = self.yesShares.get(user);
            require(shares != null && shares!! > 0, "No winning YES shares");
            payout = shares!!;
            self.yesShares.set(user, 0);
        } else {
            let shares: Int? = self.noShares.get(user);
            require(shares != null && shares!! > 0, "No winning NO shares");
            payout = shares!!;
            self.noShares.set(user, 0);
        }

        send(SendParameters{
            to: self.poolJettonWallet,
            value: ton("0.05"),
            mode: SendIgnoreErrors,
            body: JettonTransfer{
                queryId: 0,
                amount: payout,
                destination: user,
                responseDestination: user,
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: emptySlice()
            }.toCell()
        });
    }

    get fun getOdds(): map<Int, Int> {
        let total: Int = self.yesPool + self.noPool;
        let odds: map<Int, Int> = emptyMap();
        odds.set(1, (self.noPool * 100) / total); // YES %
        odds.set(0, (self.yesPool * 100) / total); // NO %
        return odds;
    }
}
