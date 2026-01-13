import { LoaderCircle } from "lucide-react";

import { cn } from "@/components/utils";

export const SpinnerLoadingIndicator = ({ children }) => {
    return (
        <div className="relative">
            <StatusBorder className="border-blue-700/40">{children}</StatusBorder>
            <div className="bg-background/50 absolute inset-0 z-50 rounded-[9px] backdrop-blur-xs" />
            <div className="absolute inset-0 z-50">
                <span className="absolute top-[calc(50%-1.25rem)] left-[calc(50%-1.25rem)] inline-block h-10 w-10 animate-ping rounded-full bg-blue-700/20" />

                <LoaderCircle className="absolute top-[calc(50%-0.75rem)] left-[calc(50%-0.75rem)] size-6 animate-spin text-blue-700" />
            </div>
        </div>
    );
};

export const BorderLoadingIndicator = ({ children }) => {
    return (
        <>
            <div className="absolute -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)]">
                <div className="absolute inset-0 overflow-hidden rounded-[9px]">
                    <div
                        className="absolute left-1/2 top-1/2 w-[140%] aspect-square rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgb(42,67,233)_0deg,rgba(42,138,246,0)_360deg)]"
                        style={{
                            animation: "spin-centered 2s linear infinite",
                        }}
                    />
                </div>
            </div>
            {children}
        </>
    );
};

const StatusBorder = ({ children, className }) => {
    return (
        <>
            <div
                className={cn(
                    "absolute -top-px -left-px h-[calc(100%+2px)] w-[calc(100%+2px)] rounded-[9px] border-2",
                    className,
                )}
            />
            {children}
        </>
    );
};

export const NodeStatusIndicator = ({ status, variant = "border", children }) => {
    switch (status) {
        case "loading":
            switch (variant) {
                case "overlay":
                    return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
                case "border":
                    return <BorderLoadingIndicator>{children}</BorderLoadingIndicator>;
                default:
                    return <>{children}</>;
            }
        case "success":
            return <StatusBorder className="border-emerald-600">{children}</StatusBorder>;
        case "error":
            return <StatusBorder className="border-red-400">{children}</StatusBorder>;
        default:
            return <>{children}</>;
    }
};
