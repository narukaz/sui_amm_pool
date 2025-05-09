import React, { useEffect, useState } from "react";
import { Loader, Loader2, Lock, Wallet } from "lucide-react";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function Liquidity() {
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [usercoins, setUsercoins] = useState([]);
  const [suiAmount, setSuiAmount] = useState(0);
  const [tokenAmount, setTokenAmount] = useState("");
  const suiClient = useSuiClient();
  const user = useCurrentAccount();
  const [hasLPToken, setHasLPToken] = useState(false);
  const [lpName, setLpName] = useState("");
  const [userLpBalance, setUserLpBalance] = useState(0);
  const [userLpCoinObjectId, setUserLpCoinObjectId] = useState("");
  console.log("user LP TOKEN Address", userLpCoinObjectId);
  console.log("user LP TOKEN balanve", userLpBalance);

  const PACKAGE_ID =
    "0x89f709658cd8d722ffc35c7c8fbbea2299ddf725737aa34398cc2a434d0bf6e3";
  const USER_BALANCE =
    "0x5a4a0c4ea7df8e2b39d277b109d123462d61bfa559274aa594de4e6873b27636";
  const LIQUIDITY_POOL_ID =
    "0x3556579d5902eb931ce992e9f5a7d2f55a3dd3dc8c45746247ebbc43f4058358";
  const LIQUIDITY_TOKEN_VAULT =
    "0x62cf3230183a3aef3c5ea42b3d5c55d5f9bbaf51874faf721535234d12f3803c";

  async function fetchAllCoins(owner) {
    const allCoins = [];
    let cursor;
    do {
      const resp = await suiClient.getAllCoins({ owner, cursor, limit: 50 });
      allCoins.push(...resp.data);
      cursor = resp.nextCursor || undefined;
    } while (cursor);
    return allCoins;
  }
  console.log("hasLPToken", hasLPToken);
  async function getLiquidityRatioTokens() {
    if (!user?.address) return;

    let {
      data: {
        content: {
          fields: {
            lp_tokens: { type },
          },
        },
      },
    } = await suiClient.getObject({
      id: LIQUIDITY_TOKEN_VAULT,
      options: {
        showContent: true,
      },
    });
    let lp_match_type = type.split("<")[1].split(">")[0];

    //testing
    const resp = await suiClient.getObject({
      id: LIQUIDITY_POOL_ID,
      options: { showContent: true },
    });
    const fields = resp.data.content.fields;

    const coinsInWallet = await fetchAllCoins(user?.address);
    console.log(coinsInWallet);
    const newCoinData = [];
    for (let i = 0; i < coinsInWallet.length; i++) {
      if (lp_match_type == coinsInWallet[i].coinType) {
        let metadata = await suiClient.getCoinMetadata({
          coinType: lp_match_type,
        });
        setLpName(metadata?.symbol);
        setHasLPToken(true);
        setUserLpBalance(coinsInWallet[i]?.balance / 10 ** metadata.decimals);
        setUserLpCoinObjectId(coinsInWallet[i]?.coinObjectId);
        console.log(metadata);
        break;
      }
    }

    for (const element of Object.values(fields)) {
      if (!element?.type) continue;
      const match = element.type.match(/<([^>]+)>/);
      if (!match) continue;
      const coinType = match[1];

      const { symbol, decimals } = await suiClient.getCoinMetadata({
        coinType,
      });
      const matchingCoins = coinsInWallet.filter(
        (c) => c.coinType === coinType
      );
      const rawSum = matchingCoins.reduce(
        (sum, c) => sum + Number(c.balance),
        0
      );

      const normalized = rawSum / Math.pow(10, decimals);
      const coinIds = matchingCoins.map((c) => ({
        objectId: c.coinObjectId,
        balance: c.balance,
      }));

      newCoinData.push({
        symbol,
        decimals,
        type: coinType,
        balance: normalized,
        coinIds,
      });
    }

    setUsercoins(newCoinData);
  }

  const addLiquidity = async () => {
    if (usercoins.length < 2) return;
    const [tokenEntry, suiEntry] = usercoins;

    // 1) balance checks
    if (tokenEntry.balance < Number(tokenAmount)) {
      alert(`Not enough ${tokenEntry.symbol}`);
      return;
    }
    if (suiEntry.balance < Number(suiAmount)) {
      alert("Not enough SUI");
      return;
    }

    // 2) collect all object IDs
    const tokenIds = tokenEntry.coinIds.map((ci) => ci.objectId);
    const suiIds = suiEntry.coinIds.map((ci) => ci.objectId);

    // ── RESERVE ONE SUI UTXO FOR GAS ──
    // take the *first* coin as our gasCoin, and only operate on the others
    const [gasSuiId, ...suiForPoolIds] = suiIds;

    // decide merging
    const shouldMergeTok = tokenIds.length > 1;
    const shouldMergeSui = suiForPoolIds.length > 1;

    const tx = new Transaction();

    // 3) merge extra custom-token coins
    if (shouldMergeTok) {
      const [mainTokenId, ...extraTokenIds] = tokenIds;
      extraTokenIds.forEach((id) =>
        tx.mergeCoins(tx.object(mainTokenId), [tx.object(id)])
      );
    }
    const [mainTokenId] = tokenIds;

    // 4) merge extra SUI *only* from suiForPoolIds
    let mainSuiId;
    if (shouldMergeSui) {
      // properly declare extraSuiIds here
      const [m, ...extraSuiIds] = suiForPoolIds;
      mainSuiId = m;
      extraSuiIds.forEach((id) =>
        tx.mergeCoins(tx.object(mainSuiId), [tx.object(id)])
      );
    } else {
      // only one UTXO to use
      [mainSuiId] = suiForPoolIds;
    }

    // 5) split off exactly what you want to add
    const tokenRaw = BigInt(tokenAmount) * BigInt(10 ** tokenEntry.decimals);
    const suiRaw = BigInt(suiAmount) * BigInt(10 ** suiEntry.decimals);

    const [tokToAdd] = tx.splitCoins(tx.object(mainTokenId), [
      tx.pure.u64(tokenRaw),
    ]);
    const [suiToAdd] = tx.splitCoins(tx.object(mainSuiId), [
      tx.pure.u64(suiRaw),
    ]);

    tx.setGasBudget(20_000);

    // 6) call Move entry
    tx.moveCall({
      package: PACKAGE_ID,
      module: "custom_token",
      function: "add_liquidity_to_the_pool",
      arguments: [
        tx.object(LIQUIDITY_POOL_ID), // &mut LiquidityPool
        suiToAdd, // mut Coin<SUI>
        tokToAdd, // mut Coin<CUSTOM_TOKEN>
        tx.pure.u64(suiRaw), // u64 sui_amount
        tx.object(LIQUIDITY_TOKEN_VAULT), // &mut LiquidityTokenVault
        tx.object(USER_BALANCE), // &mut UserVaultLedger
      ],
    });

    tx.setSender(user.address);

    // 7) sign & execute
    const { bytes, signature } = await signTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });
    await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
    });
  };

  const redeemToken = async (coinId, amount) => {
    if (!coinId || !amount) return;
    const tx = new Transaction();
    console.log(
      LIQUIDITY_POOL_ID,
      coinId,
      amount,
      LIQUIDITY_TOKEN_VAULT,
      USER_BALANCE
    );
    tx.moveCall({
      package: PACKAGE_ID,
      module: "custom_token",
      function: "redeem",
      arguments: [
        tx.object(LIQUIDITY_POOL_ID),
        tx.object(coinId),
        tx.pure.u64(amount * 10 ** 4),
        tx.object(LIQUIDITY_TOKEN_VAULT),
        tx.object(USER_BALANCE),
      ],
    });
    tx.setSender(user.address);
    const { bytes, signature } = await signTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });
    await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
    });
    getLiquidityRatioTokens();
  };

  useEffect(() => {
    getLiquidityRatioTokens();
  }, [user?.address]);

  // useEffect(() => {
  //   const id = setInterval(
  //     () => getLiquidityRatioTokens(userLpCoinObjectId, userLpBalance),
  //     3000
  //   );
  //   return () => clearInterval(id);
  // }, [userLpCoinObjectId, userLpBalance]);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-4">
          <div
            className="mr-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
            onClick={() => console.log("Change SUI token")}
          >
            {!usercoins[1]?.symbol ? (
              <Loader2 className="animate-spin" />
            ) : (
              usercoins[1]?.symbol
            )}
          </div>
          <input
            type="number"
            placeholder="Amount to stake"
            className="flex-1 outline-none text-right text-xl text-gray-900 placeholder-gray-400 bg-transparent"
            min="0"
            value={suiAmount}
            onChange={(e) => setSuiAmount(e.target.value)}
          />
        </div>
        <div className="text-right text-sm text-gray-500">
          Balance: {(usercoins[1]?.balance ?? 0).toFixed(1)}{" "}
          {usercoins[1]?.symbol}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-4">
          <div
            className="mr-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
            onClick={() => console.log("Change token")}
          >
            {!usercoins[0]?.symbol ? (
              <Loader2 className="animate-spin" />
            ) : (
              usercoins[0]?.symbol
            )}
          </div>
          <input
            type="number"
            placeholder="Amount to stake"
            className="flex-1 outline-none text-right text-xl text-gray-900 placeholder-gray-400:bg-transparent"
            min="0"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
          />
        </div>
        <div className="text-right text-sm text-gray-500">
          Balance: {(usercoins[0]?.balance ?? 0).toFixed(1)}{" "}
          {usercoins[0]?.symbol}
        </div>
      </div>
      {!user?.address ? (
        <div className="w-full flex cursor-pointer items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4">
          <Lock />
          connect wallet first!
        </div>
      ) : (
        <button
          onClick={addLiquidity}
          className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4"
        >
          Add to Liquidity Pool
        </button>
      )}

      <div className="mt-6 min-h-[120px]">
        {hasLPToken ? (
          <div className="max-w-xs mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Wallet className="w-6 h-6" />
              <span>{lpName}</span>
            </div>

            {/* Balance */}
            <div className="text-gray-700 text-2xl">
              {userLpBalance} <span className="font-medium">{lpName}</span>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-200" />

            {/* Redeem Button */}
            <button
              onClick={() => redeemToken(userLpCoinObjectId, userLpBalance)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-2xl transition-colors duration-200"
            >
              Redeem
            </button>
          </div>
        ) : (
          <div className="max-w-xs mx-auto border-t border-dashed border-gray-500 text-center py-6 text-gray-500">
            no liquidity tokens found in wallet!
          </div>
        )}
      </div>
    </>
  );
}
