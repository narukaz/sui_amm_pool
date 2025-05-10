import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const PARTICLE_COUNT = 9;
  const particles = Array.from({ length: PARTICLE_COUNT });
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden p-4 bg-black">
      {particles.map((_, i) => {
        const size = 8 + Math.random() * 16;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = 4 + Math.random() * 3;
        const delay = Math.random() * 2;
        return (
          <div
            key={i}
            className="absolute bg-white opacity-20 rounded-full"
            style={{
              width: size,
              height: size,
              top: `${posY}%`,
              left: `${posX}%`,
              animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`,
            }}
          />
        );
      })}

      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-3xl">
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-400 to-white"
          style={{ WebkitBackgroundClip: "text" }}
        >
          SUI AMM Visualizer
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-xl">
          Swap, Pool, Earn — All in One. Experience the future of decentralized
          finance in style.
        </p>
        {/* <Link to="/application" className="group"> */}
        <button
          onClick={() => navigate("/application")}
          className="cursor-pointer text-lg px-8 py-4 rounded-full shadow-xl bg-white text-black hover:bg-gray-200 transform hover:scale-105 transition-transform duration-300 ease-out flex items-center justify-center"
        >
          Launch App
          <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        {/* </Link> */}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white/50 z-10">
        <p>
          © {new Date().getFullYear()} SUI AMM Visualizer. All rights reserved.
        </p>
      </div>
    </div>
  );
}
