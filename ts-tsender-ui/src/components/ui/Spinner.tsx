export interface SpinnerProps {
    message?: string
}

export function Spinner({ message = "Processing..." }: SpinnerProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
                {/* Spinner Animation */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-zinc-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                </div>

                {/* Message */}
                <div className="text-center">
                    <p className="text-zinc-900 font-semibold text-lg">{message}</p>
                    <p className="text-zinc-500 text-sm mt-1">Please wait...</p>
                </div>
            </div>
        </div>
    )
}
