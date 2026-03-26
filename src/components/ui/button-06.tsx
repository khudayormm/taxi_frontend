"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface AnimatedTransactionButtonProps {
    type: "kirim" | "chiqim";
    onClick?: () => void;
    disabled?: boolean;
}

export function AnimatedTransactionButton({
    type,
    onClick,
    disabled = false,
}: AnimatedTransactionButtonProps) {
    const isKirim = type === "kirim";

    const borderGradient = isKirim
        ? "bg-[conic-gradient(from_0deg,_#0088cc_0deg,_#0088cc_40deg,_transparent_60deg)]"
        : "bg-[conic-gradient(from_0deg,_#ef4444_0deg,_#ef4444_40deg,_transparent_60deg)]";

    const buttonText = isKirim ? "KIRIM" : "CHIQIM";
    const Icon = isKirim ? ArrowDownLeft : ArrowUpRight;
    const variant = isKirim ? "telegram" : "destructive";

    return (
        <div className="w-full h-fit relative inline-flex rounded-lg overflow-hidden">
            {/* Animated gradient border */}
            {!disabled && (
                <span className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
                    <span
                        className={`absolute -inset-full animate-spin [animation-duration:3s] ${borderGradient}`}
                    />
                </span>
            )}

            {/* Button */}
            <Button
                onClick={onClick}
                disabled={disabled}
                variant={variant}
                className={`
          relative h-14 z-10 m-[2px] w-full text-lg font-bold rounded-lg shadow-none
          transition-all duration-300
          
          ${disabled
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                        : isKirim
                            ? "bg-[#0088cc] text-white hover:bg-[#0077b5] hover:scale-105 active:scale-95"
                            : "bg-red-500 text-white hover:bg-red-600 hover:scale-105 active:scale-95"
                    }
        `}
            >
                <Icon className="size-5" />
                {buttonText}
            </Button>
        </div>
    );
}
