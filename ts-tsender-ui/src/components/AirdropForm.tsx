"use client"

import { InputForm } from "@/components/ui/InputField"
import { useState, useMemo, useEffect } from "react"
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants"
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi"
import { readContract, waitForTransactionReceipt } from "@wagmi/core"
import { calculateTotal } from "@/utils"

// LocalStorage keys
const STORAGE_KEYS = {
    TOKEN_ADDRESS: 'tsender_token_address',
    RECIPIENTS: 'tsender_recipients',
    AMOUNTS: 'tsender_amounts'
}

export default function AirdropForm() {
    const [tokenAddress, setTokenAddress] = useState("")
    const [recipients, setRecipients] = useState("")
    const [amounts, setAmounts] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState("")
    const [tokenDetails, setTokenDetails] = useState<{
        name: string
        symbol: string
        decimals: number
    } | null>(null)
    const chainId = useChainId()
    const config = useConfig()
    const account = useAccount()
    const total: number = useMemo(() => calculateTotal(amounts), [amounts])
    const { data: hash, isPending, writeContractAsync } = useWriteContract()

    // Load saved values from localStorage on component mount
    useEffect(() => {
        const savedTokenAddress = localStorage.getItem(STORAGE_KEYS.TOKEN_ADDRESS)
        const savedRecipients = localStorage.getItem(STORAGE_KEYS.RECIPIENTS)
        const savedAmounts = localStorage.getItem(STORAGE_KEYS.AMOUNTS)

        if (savedTokenAddress) setTokenAddress(savedTokenAddress)
        if (savedRecipients) setRecipients(savedRecipients)
        if (savedAmounts) setAmounts(savedAmounts)
    }, [])

    // Save tokenAddress to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.TOKEN_ADDRESS, tokenAddress)
    }, [tokenAddress])

    // Save recipients to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.RECIPIENTS, recipients)
    }, [recipients])

    // Save amounts to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.AMOUNTS, amounts)
    }, [amounts])

    // Fetch token details when token address changes
    useEffect(() => {
        async function fetchTokenDetails() {
            if (!tokenAddress || tokenAddress.length !== 42 || !tokenAddress.startsWith('0x')) {
                setTokenDetails(null)
                return
            }

            try {
                const [name, symbol, decimals] = await Promise.all([
                    readContract(config, {
                        abi: erc20Abi,
                        address: tokenAddress as `0x${string}`,
                        functionName: "name",
                    }),
                    readContract(config, {
                        abi: erc20Abi,
                        address: tokenAddress as `0x${string}`,
                        functionName: "symbol",
                    }),
                    readContract(config, {
                        abi: erc20Abi,
                        address: tokenAddress as `0x${string}`,
                        functionName: "decimals",
                    }),
                ])

                setTokenDetails({
                    name: name as string,
                    symbol: symbol as string,
                    decimals: decimals as number,
                })
            } catch (error) {
                console.error("Error fetching token details:", error)
                setTokenDetails(null)
            }
        }

        fetchTokenDetails()
    }, [tokenAddress, config])

    async function getApprovedAmount(tSenderAddress: string | null): Promise<number> {
        if (!tSenderAddress) {
            alert("No Address found, Please use a Supported chain")
            return 0
        }

        const response = await readContract(config, {
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "allowance",
            args: [account.address, tSenderAddress as `0x${string}`]
        })

        return response as number
    }

    async function handleSubmit() {
        try {
            setIsLoading(true)
            const tSenderAddress = chainsToTSender[chainId]["tsender"]
            const approvedAmount = await getApprovedAmount(tSenderAddress)
            // console.log("approvedAmount: ", approvedAmount);

            if (approvedAmount < total) {
                // Show spinner for approval
                setLoadingMessage("Waiting for approval in MetaMask...")

                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "approve",
                    args: [tSenderAddress as `0x${string}`, BigInt(total)],
                })

                setLoadingMessage("Processing approval transaction...")
                const approvalReceipt = await waitForTransactionReceipt(config, {
                    hash: approvalHash
                })

                console.log("Approval confirmed", approvalReceipt);

                setLoadingMessage("Waiting for airdrop confirmation in MetaMask...")
                await writeContractAsync({
                    abi: tsenderAbi,
                    address: tSenderAddress as `0x${string}`,
                    functionName: "airdropERC20",
                    args: [
                        tokenAddress,
                        // Comma or new line separated
                        recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
                        amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== ''),
                        BigInt(total),
                    ]
                })

                setLoadingMessage("Processing airdrop transaction...")

            } else {
                setLoadingMessage("Waiting for confirmation in MetaMask...")

                await writeContractAsync({
                    abi: tsenderAbi,
                    address: tSenderAddress as `0x${string}`,
                    functionName: "airdropERC20",
                    args: [
                        tokenAddress,
                        // Comma or new line separated
                        recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
                        amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== ''),
                        BigInt(total),
                    ]
                })

                setLoadingMessage("Processing transaction...")
            }

            // Transaction successful
            setIsLoading(false)
            alert("Airdrop successful!")
        } catch (error) {
            console.error("Transaction error:", error)
            setIsLoading(false)
            // User rejected or error occurred
        }
    }

    function clearForm() {
        setTokenAddress("")
        setRecipients("")
        setAmounts("")
        localStorage.removeItem(STORAGE_KEYS.TOKEN_ADDRESS)
        localStorage.removeItem(STORAGE_KEYS.RECIPIENTS)
        localStorage.removeItem(STORAGE_KEYS.AMOUNTS)
    }


    return (
        <div>
            <InputForm
                label="Token Address"
                placeholder="0x"
                value={tokenAddress}
                onChange={e => setTokenAddress(e.target.value)}
            />
            <InputForm
                label="Recipients"
                placeholder="0x1234123, 0x1893fbd"
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                large={true}
            />
            <InputForm
                label="Amounts"
                placeholder="100, 200, 300, ..."
                value={amounts}
                onChange={e => setAmounts(e.target.value)}
                large={true}
            />

            {/* Transaction Details Box - Always visible, above buttons */}
            <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                <h3 className="text-zinc-700 font-semibold text-sm mb-3">Transaction Details</h3>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-600 text-sm">Token Name:</span>
                        <span className="text-zinc-900 font-medium text-sm text-right">
                            {tokenDetails ? `${tokenDetails.name} (${tokenDetails.symbol})` : '-'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-zinc-600 text-sm">Amount (wei):</span>
                        <span className="text-zinc-900 font-medium text-sm font-mono">
                            {total > 0 ? total.toLocaleString() : '-'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-zinc-600 text-sm">Amount (tokens):</span>
                        <span className="text-zinc-900 font-medium text-sm font-mono">
                            {tokenDetails && total > 0
                                ? (total / Math.pow(10, tokenDetails.decimals)).toFixed(2)
                                : '-'
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
                >
                    {isLoading && (
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    )}
                    {isLoading ? loadingMessage : "Send tokens"}
                </button>

                <button
                    onClick={clearForm}
                    disabled={isLoading}
                    className="bg-zinc-500 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear Form
                </button>
            </div>

        </div>
    )
}