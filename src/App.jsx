import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/home/home";
import Application from "./components/app/application";
import Swap from "./components/swap/swap.jsx";
import Liquidity from "./components/liquidity/liquidity.jsx";

// Config options for the networks you want to connect to

function App() {
  return (
    <>
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="home" element={<Home />} />

        <Route path="/application" element={<Application />}>
          <Route index element={<Swap />} />
          <Route path="swap" element={<Swap />} />
          <Route path="liquidity" element={<Liquidity />} />
          <Route path="*" element={<Navigate to="swap" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
