import React, { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";

export default function Swap() {
  let suiClient = useSuiClient();
  const [isPopup, setIsPopup] = useState(false);
  const [why, setWhy] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [coins, setCoins] = useState([]);
  const user = useCurrentAccount();

  const PACKAGE_ID =
    "0x89f709658cd8d722ffc35c7c8fbbea2299ddf725737aa34398cc2a434d0bf6e3";
  const USER_BALANCE =
    "0x5a4a0c4ea7df8e2b39d277b109d123462d61bfa559274aa594de4e6873b27636";
  const LIQUIDITY_POOL_ID =
    "0x3556579d5902eb931ce992e9f5a7d2f55a3dd3dc8c45746247ebbc43f4058358";
  const LIQUIDITY_TOKEN_VAULT =
    "0x62cf3230183a3aef3c5ea42b3d5c55d5f9bbaf51874faf721535234d12f3803c";

  useEffect(() => {
    const fetchCoins = async () => {
      if (user?.address) {
        const res = await suiClient.getAllCoins({ owner: user?.address });
        const metadata = await suiClient.getCoinMetadata({
          coinType:
            "0x47b07c98eb2ba318ae08f27e92c97616c4307495df8e73c437874aae81bb8c95::basic_token::BASIC_TOKEN",
        });

        console.log(metadata);
        console.log(res);
      }
    };
    try {
      fetchCoins();
    } catch (error) {
      console.log(error);
    }
  }, [user?.address]);

  return (
    <>
      {/* wrap both fields here with vertical gap */}
      {isPopup && (
        <>
          <div
            onClick={() => setIsPopup(false)}
            className="absolute left-0 top-0 bg-black opacity-15 w-full h-lvh z-10 "
          ></div>
          <div className="bg-white w-lg h-auto absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-5 rounded-2xl">
            <div
              onClick={() => {
                setWhy("");
              }}
              className="bg-gray-400 w-md rounded-xl shadow-md px-5 py-4 flex justify-between items-center gap-4 cursor-pointer hover:scale-110 transition-all"
            >
              <h1 className="text-2xl">Name</h1>
              <h1 className="text-2xl">Coin</h1>
            </div>
          </div>
        </>
      )}
      <div className="space-y-4">
        {/* From Field */}
        <div className="flex gap-5 items-center border border-gray-300 rounded-xl px-4 py-4">
          <div
            className="mr-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
            onClick={() => {
              setWhy("to");
              setIsPopup((prev) => !prev);
              console.log("Change FROM token");
            }}
          >
            ETH
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

        {/* To Field */}
        <div className="flex gap-5 items-center border border-gray-300 rounded-xl px-4 py-4">
          <div
            className="mr-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
            onClick={() => {
              setWhy("from");
              setIsPopup((prev) => !prev);
            }}
          >
            USDC
          </div>
          <input
            type="number"
            placeholder="Enter amount"
            className="flex-1 outline-none text-right text-xl text-gray-900 placeholder-gray-400 bg-transparent"
            min="0"
            value={toAmount}
            disabled
            onChange={(e) => setToAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="flex justify-between text-sm text-gray-600 mt-4">
        <span>Slippage: 0.5%</span>
        <span>Min received: 0 USDC</span>
      </div>

      {/* Swap Button */}
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 rounded-xl transition-colors duration-200 mt-4">
        Confirm Swap
      </button>
    </>
  );
}
