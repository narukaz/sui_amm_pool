# Visualizers AMM

A minimal React + Vite template powers the frontend for Visualizers AMM, providing hot module replacement (HMR) and ESLint support. For production, consider integrating TypeScript and `typescript-eslint` following the [Vite React TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

---

## 🚀 Project Overview

Visualizers AMM is a decentralized automated market maker (AMM) marketplace built on the Sui testnet. It allows users to seamlessly:

- **Swap tokens** with minimal slippage and zero intermediaries.
- **Provide liquidity** in a 1 SUI : 200 Custom Token ratio to earn LP rewards.
- **Redeem liquidity** at any time, retrieving underlying assets.

By leveraging a trustless, permissionless architecture, Visualizers AMM ensures security, transparency, and efficiency for all participants.

---

## 🔧 Setup & Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/narukaz/sui_amm_pool.git
   cd sui_amm_pool
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run dev server**

   ```bash
   npm run dev
   ```

---

## 🔗 Project Links

- **Homepage:** [https://visualizerswap.vercel.app/](https://visualizerswap.vercel.app/)
- **GitHub Repo:** [https://github.com/narukaz/sui_amm_pool](https://github.com/narukaz/sui_amm_pool)
- **Demo Video:** [https://youtu.be/bnItYZpZOVc](https://youtu.be/bnItYZpZOVc)

---

## 📦 Deployment Details

- **Network:** Sui Testnet
- **Package ID:** `0xe1a3a986f41ed1d241949475723c745684b2222d3ef0aa44e9c18adb2f47b303`

---

## 🛠 Usage

1. **Add Liquidity**

   - Connect your Sui-compatible wallet (e.g., Sui Wallet).
   - Navigate to **Add Liquidity**.
   - Enter **1 SUI** and **200 Custom Tokens** (1:200 ratio).
   - Approve and submit the transaction.
   - Receive LP tokens representing your share.

2. **Swap Tokens**

   - Go to **Swap**.
   - Select the SUI ↔ Custom Token pair.
   - Enter swap amount and review output.
   - Approve and submit transaction.
   - Swapped tokens arrive in your wallet.

3. **Redeem Liquidity**

   - Visit **Remove Liquidity**.
   - Choose pool and LP tokens to redeem.
   - Approve and submit removal.
   - Receive underlying SUI and Custom Tokens.

---

## 📖 How It Works

1. **AMM Formula:** Pools use the constant product formula (`x * y = k`) to determine prices.
2. **LP Rewards:** Providers earn a share of swap fees proportional to pool ownership.
3. **Trustless Execution:** Smart contracts manage all operations without custodial risk.

---

## 📄 Legal & License

No license file is included. Use at your own risk; this is provided as-is for demonstration on testnet.

---

_Thank you for exploring Visualizers AMM! Feel free to ⭐ the repo and open issues or PRs with feedback or enhancements._
