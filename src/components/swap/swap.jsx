import React, { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { ChevronDown } from "lucide-react";

export default function Swap() {
  const suiClient = useSuiClient();
  const user = useCurrentAccount();

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [totalTo, setTotalTo] = useState(0);
  const [totalFrom, setTotalfrom] = useState(0);
  const [fromCurrency, setFromCurrency] = useState("ETH");
  const [toCurrency, setToCurrency] = useState("USDC");
  const [coins, setCoins] = useState([]);

  const PACKAGE_ID =
    "0x89f709658cd8d722ffc35c7c8fbbea2299ddf725737aa34398cc2a434d0bf6e3";
  const USER_BALANCE =
    "0x5a4a0c4ea7df8e2b39d277b109d123462d61bfa559274aa594de4e6873b27636";
  const LIQUIDITY_POOL_ID =
    "0x3556579d5902eb931ce992e9f5a7d2f55a3dd3dc8c45746247ebbc43f4058358";
  const LIQUIDITY_TOKEN_VAULT =
    "0x62cf3230183a3aef3c5ea42b3d5c55d5f9bbaf51874faf721535234d12f3803c";

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

    const supported_coins = [];

    for (const field of Object.values(fields)) {
      if (!field.type) continue;
      const coin_type = field.type.split("<")[1]?.split(">")[0];
      if (!coin_type) continue;

      const { symbol, decimals } = await suiClient.getCoinMetadata({
        coinType: coin_type,
      });
      const matches = allCoins.filter(
        (c) => c.coinType === coin_type && c.balance !== "0"
      );
      const totalRaw = matches.reduce((acc, c) => acc + BigInt(c.balance), 0n);

      const coinsArr = matches.map((c) => ({
        object_id: c.coinObjectId,
        balance: c.balance,
        normalized: Number(c.balance) / 10 ** decimals,
      }));

      supported_coins.push({
        symbol,
        decimals,
        balance: Number(totalRaw) / 10 ** decimals,
        rawBalance: totalRaw.toString(),
        coins: coinsArr,
      });
    }

    setCoins(supported_coins);
  };

  useEffect(() => {
    getCoinsSupportedByPool();
  }, [user?.address]);
  console.log(coins);

  return (
    <>
      <div className="space-y-4">
        {/* From Field */}
        <div>
          <div className="flex gap-5 items-center border border-gray-300 rounded-xl px-4 py-4">
            <div className="relative inline-block w-32">
              <select
                value={fromCurrency}
                onChange={(e) => {
                  const symbol = e.target.value;
                  setFromCurrency(symbol);
                  const c = coins.find(
                    (c) => c.symbol.toLowerCase() === symbol
                  );
                  setTotalfrom(c ? c.balance : 0);
                }}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {coins.map((coin) => (
                  <option key={coin.symbol} value={coin.symbol.toLowerCase()}>
                    {coin.symbol}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            <input
              type="number"
              placeholder="Enter amount"
              className="flex-1 outline-none text-right text-xl text-gray-900 placeholder-gray-400 bg-transparent"
              min="0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
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
              <select
                value={toCurrency}
                onChange={(e) => {
                  const symbol = e.target.value;
                  setToCurrency(symbol);
                  const c = coins.find(
                    (c) => c.symbol.toLowerCase() === symbol
                  );
                  setTotalTo(c ? c.balance : 0);
                }}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {coins.map((coin) => (
                  <option key={coin.symbol} value={coin.symbol.toLowerCase()}>
                    {coin.symbol}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            <input
              type="number"
              placeholder="0"
              className="flex-1 outline-none text-right text-xl text-gray-900 placeholder-gray-400 bg-transparent"
              min="0"
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
        <span>Slippage: 0.5%</span>
        <span>Min received: 0 {toCurrency.toUpperCase()}</span>
      </div>

      {/* Swap Button */}
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4">
        Confirm Swap
      </button>
    </>
  );
}
