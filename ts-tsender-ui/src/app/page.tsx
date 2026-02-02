"use client"

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi"

export default function Home() {
  const { isConnected } = useAccount()
  return (
    <div>
      {!isConnected ? (
          <div>
            Please Connect a Wallet...
          </div>
        ) : (
          <div>
            <HomeContent />
          </div>
        )
      }
    </div>
  );
}
