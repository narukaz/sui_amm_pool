import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ConnectModal } from "@mysten/dapp-kit";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Coins,
  DollarSign,
  Flame,
  Gift,
  Info,
  Trash2,
  Wallet,
} from "lucide-react";
export default function Application() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("swap");

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("liquidity")) {
      setActivePage("liquidity");
    } else {
      setActivePage("swap");
    }
  }, [location]);
  return (
    <>
      <div className=" bg-black flex flex-col items-center h-lvh">
        <div className="absolute bg-transparent flex justify-between items-center w-full py-3 px-8 ">
          <h1 className="text-white">Visualizer swap</h1>
          <ConnectButton className="bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2 rounded-2xl" />
        </div>
        <div className=" rounded-2xl overflow-hidden  bg-gradient-to-br from-[#4c5896] to-[#f6a86e] w-[95%] h-lvh mt-18 grid grid-cols-2  ">
          <div className="bg-transparent mx-auto w-full flex items-center justify-center ">
            <div className="max-w-lg bg-white  shadow-lg p-8 space-y-8 rounded-2xl">
              {/* Tab Navigation */}
              <div className="w-full flex items-center justify-center gap-3 mb-6    ">
                <button
                  onClick={() => {
                    navigate("swap");
                  }}
                  className={`${
                    activePage == "swap"
                      ? "bg-black text-white "
                      : "bg-white text-black "
                  }rounded-xl px-5 py-2 text-2xl cursor-pointer transition-all hover:text-blue-600`}
                >
                  Swap
                </button>
                <h1 className="text-2xl">|</h1>
                <button
                  onClick={() => {
                    navigate("liquidity");
                  }}
                  className={`${
                    activePage == "liquidity"
                      ? "bg-black text-white "
                      : "bg-white text-black "
                  }   rounded-xl px-5 py-2 text-2xl cursor-pointer transition-all hover:text-blue-600`}
                >
                  Liquidity
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-transparent grid grid-rows-2 gap-6 p-4 ">
            {/* Swap Statistics Card */}
            <div className="bg-white p-6 space-y-4 rounded-2xl flex flex-col">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-600">
                <Activity className="w-5 h-5 text-gray-600" /> Swap Statistics
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Flame className="w-5 h-5 text-gray-600" />
                  <span>Transactions: 12,345</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <span>Fees Generated: $45,678</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Trash2 className="w-5 h-5 text-gray-600" />
                  <span>Fees Burned: $12,000</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Info className="w-5 h-5 text-gray-600" />
                  <span>Smart Routing Enabled</span>
                </div>
              </div>
            </div>

            {/* Liquidity Pool Card */}
            <div className="bg-white p-6 space-y-4 rounded-2xl flex flex-col">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-600">
                <Wallet className="w-5 h-5 text-gray-600" /> Liquidity Pool
                Overview
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Coins className="w-5 h-5 text-gray-600" />
                  <span>Total Liquidity: $120,000</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Gift className="w-5 h-5 text-gray-600" />
                  <span>Reward Yield: 6.5% APR</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <span>Daily Rewards: ~$1,234</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-2xl">
                  <Info className="w-5 h-5 text-gray-600" />
                  <span>Extra incentives for LPs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
