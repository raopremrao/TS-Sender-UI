"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {anvil, zksync, mainnet, sepolia} from "wagmi/chains"

export default getDefaultConfig({
    appName: "TSender",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [mainnet, sepolia, anvil, zksync ],
    ssr: false
})