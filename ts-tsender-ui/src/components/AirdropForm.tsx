"use client"

import {InputForm} from "@/components/ui/InputField"
import { useState } from "react"

export default function AirdropForm() {
    const [tokenAddress, setTokenAddress] = useState("")
    const [recipients, setRecipients] = useState("")
    const [amounts, setAmounts] = useState("")

    async function handleSubmit() {
        console.log("Hello from Submit Button ");
        console.log("tokenAddress: ", tokenAddress);
        console.log("recipients: ", recipients);
        console.log("amounts: ", amounts);        
    }

    return(
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

            <button onClick={handleSubmit}>
                Send tokens
            </button>

        </div>
    )
}