import React, { useEffect, useState } from "react";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";

export default function Swap() {
  const suiClient = useSuiClient();
  const user = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  // amounts & balances
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [totalFrom, setTotalFrom] = useState(0);
  const [totalTo, setTotalTo] = useState(0);

  // selected coin symbols & objects
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [fromObject, setFromObject] = useState(null);
  const [toObject, setToObject] = useState(null);

  // fetched coins
  const [coins, setCoins] = useState([]);

  const PACKAGE_ID =
    "0xe1a3a986f41ed1d241949475723c745684b2222d3ef0aa44e9c18adb2f47b303";
  const USER_BALANCE =
    "0x2999e99e39b4ed68a1e12b1f2b17c73823c688a6c0d4a9640e2d085f84445f80";
  const LIQUIDITY_POOL_ID =
    "0x5bbae60ee0a44e9dd282a7efd79a811dac52dede6d8b72c69a625f3e9cca6dc1";
  const LIQUIDITY_TOKEN_VAULT =
    "0xdd54d5a2e2d9c2ae1667c527684239ac1b88562bfd70fbf88274a93df63af85c";

  // load on‐chain coins and pool metadata
  const getCoinsSupportedByPool = async () => {
    if (!user?.address) return;
    const allCoins = [];
    let cursor = null;
    do {
      const resp = await suiClient.getAllCoins({
        owner: user.address,
        cursor,
        limit: 50,
      });
      allCoins.push(...resp.data);
      cursor = resp.nextCursor || null;
    } while (cursor);

    const {
      data: {
        content: { fields },
      },
    } = await suiClient.getObject({
      id: LIQUIDITY_POOL_ID,
      options: { showContent: true },
    });

    const supported = [];
    for (const field of Object.values(fields)) {
      if (!field.type) continue;
      const coinType = field.type.split("<")[1]?.split(">")[0];
      if (!coinType) continue;
      const { symbol, decimals } = await suiClient.getCoinMetadata({
        coinType,
      });
      const matches = allCoins.filter(
        (c) => c.coinType === coinType && c.balance !== "0"
      );
      const totalRaw = matches.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      supported.push({
        symbol,
        decimals,
        balance: Number(totalRaw) / 10 ** decimals,
        rawBalance: totalRaw.toString(),
        coins: matches.map((c) => ({
          object_id: c.coinObjectId,
          balance: c.balance,
          normalized: Number(c.balance) / 10 ** decimals,
        })),
      });
    }
    setCoins(supported);
  };
  useEffect(() => {
    getCoinsSupportedByPool();
  }, [user?.address]);

  const fetchPrice = async (value) => {
    try {
      if (fromObject.symbol == toObject.symbol) {
        setToAmount(fromAmount);
        return;
      }

      if (value == 0) {
        setToAmount(0);
        return;
      }

      let fn = `${fromObject.symbol.toLowerCase()}_to_${toObject.symbol.toLowerCase()}_price`;
      console.log(fn);
      const fromDecimalsBI = BigInt(fromObject.decimals);
      const amountBI = BigInt(value);

      // scale your input into u64 base units
      const scaledAmount = amountBI * 10n ** fromDecimalsBI;

      const tx = new Transaction();
      tx.moveCall({
        package: PACKAGE_ID,
        module: "custom_token",
        function: fn,
        arguments: [tx.pure.u64(scaledAmount)],
        typeArguments: [],
      });

      const res = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: user?.address,
      });

      const rawRet = res.results?.[0].returnValues?.[0][0];

      // bytesToBigIntLE(rawRet);

      const u8 = new Uint8Array(rawRet);
      const view = new DataView(u8.buffer);

      // 3) Read a 64‑bit unsigned little‑endian integer
      const asBigInt = view.getBigUint64(0, true);
      setToAmount(Number(asBigInt) / 10 ** toObject.decimals);
    } catch (e) {
      console.error(e);
    }
  };

  async function swapTokens(value, fromObject, toObject) {
    if (!fromObject || !toObject || !user?.address) return;
    if (fromObject.symbol === toObject.symbol) return;

    const fn = `${fromObject.symbol.toLowerCase()}_to_${toObject.symbol.toLowerCase()}_swap`;

    // 1) pick coins
    const coins = fromObject.coins.map((c) => c.object_id);
    if (!coins.length) throw new Error("No input coins");
    const [gasCoin, ...mergeCoins] = coins;

    // 2) build TX
    const tx = new Transaction();

    // 3) merge extras
    const mainCoinId = mergeCoins.length ? mergeCoins[0] : gasCoin;
    mergeCoins.slice(mergeCoins.length ? 1 : 0).forEach((id) => {
      tx.mergeCoins(tx.object(mainCoinId), [tx.object(id)]);
    });

    // 4) compute rawValue with decimals
    const decimals = fromObject.decimals;
    const rawValue = value * 10 ** decimals;

    // split exactly rawValue
    const [coinToSwap] = tx.splitCoins(tx.object(mainCoinId), [
      tx.pure.u64(rawValue),
    ]);

    console.log("from_amount", rawValue);
    // 5) moveCall swap
    tx.moveCall({
      package: PACKAGE_ID,
      module: "custom_token",
      function: fn,
      arguments: [
        tx.object(LIQUIDITY_POOL_ID),
        coinToSwap,
        tx.pure.u64(rawValue),
      ],
    });

    // 6) gas & send
    // tx.setGasBudget(1_000_000);
    tx.setSender(user.address);

    const { bytes, signature } = await signTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });
    const res = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
    });
    console.log("swap result:", res);
    getCoinsSupportedByPool();
  }

  // once coins arrive, set defaults
  useEffect(() => {
    if (coins.length >= 2) {
      const a = coins[0],
        b = coins[1];
      setFromCurrency(a.symbol.toLowerCase());
      setToCurrency(b.symbol.toLowerCase());
      setTotalFrom(a.balance);
      setTotalTo(b.balance);
      setFromObject(a);
      setToObject(b);
    }
  }, [coins]);

  return (
    <>
      <div className="space-y-4">
        {/* From Field */}
        <div>
          <div className="flex gap-5 items-center border border-gray-300 rounded-xl px-4 py-4">
            <div className="relative inline-block w-32">
              {coins.length === 0 ? (
                <div className="w-full h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg">
                  <Loader2 className="animate-spin w-5 h-5 text-gray-500" />
                </div>
              ) : (
                <>
                  <select
                    value={fromCurrency}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setFromCurrency(sym);
                      const obj = coins.find(
                        (c) => c.symbol.toLowerCase() === sym
                      );
                      if (obj) {
                        setFromObject(obj);
                        setTotalFrom(obj.balance);
                        fetchPrice(fromAmount);
                      }
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {coins.map((c) => (
                      <option key={c.symbol} value={c.symbol.toLowerCase()}>
                        {c.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </>
              )}
            </div>
            <input
              type="number"
              placeholder="Enter amount"
              className="flex-1 outline-none text-right text-xl bg-transparent"
              value={fromAmount}
              onChange={(e) => {
                const v = e.target.value;
                setFromAmount(v);
                fetchPrice(v, fromObject, toObject);
              }}
            />
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">
            Balance: {totalFrom.toFixed(4)} {fromCurrency.toUpperCase()}
          </div>
        </div>

        {/* To Field */}
        <div>
          <div className="flex gap-5 items-center border border-gray-300 rounded-xl px-4 py-4">
            <div className="relative inline-block w-32">
              {coins.length === 0 ? (
                <div className="w-full h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg">
                  <Loader2 className="animate-spin w-5 h-5 text-gray-500" />
                </div>
              ) : (
                <>
                  <select
                    value={toCurrency}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setToCurrency(sym);
                      const obj = coins.find(
                        (c) => c.symbol.toLowerCase() === sym
                      );
                      if (obj) {
                        setToObject(obj);
                        setTotalTo(obj.balance);
                        fetchPrice(fromAmount);
                      }
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {coins.map((c) => (
                      <option key={c.symbol} value={c.symbol.toLowerCase()}>
                        {c.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </>
              )}
            </div>
            <input
              type="number"
              placeholder="0"
              className="flex-1 outline-none text-right text-xl bg-transparent"
              value={toAmount}
              disabled
            />
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">
            Balance: {totalTo.toFixed(4)} {toCurrency.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex justify-between text-sm text-gray-600 mt-4">
        <span>{null}</span>
        <span>
          Min received: {toAmount} {toCurrency.toUpperCase()}
        </span>
      </div>

      {/* Swap Button */}
      {!user?.address ? (
        <div className="w-full flex cursor-pointer items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4">
          <Lock />
          connect wallet first!
        </div>
      ) : (
        <button
          onClick={() => {
            swapTokens(fromAmount, fromObject, toObject);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4"
        >
          Confirm Swap
        </button>
      )}
    </>
  );
}
