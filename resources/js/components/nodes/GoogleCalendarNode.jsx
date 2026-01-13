import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { getNodeTypeStyles, nodeIcons } from "@/constants/nodeStyles";

const GoogleCalendarNode = ({ data, selected, id }) => {
    const nodeStatus = data.status || "initial";
    const isDark = useDarkMode();

    const typeStyles = getNodeTypeStyles(isDark);
    const style = typeStyles.googleCalendarAction;
    const icon = nodeIcons.googleCalendarAction;

    const isLoading = nodeStatus === "loading";
    const isSuccess = nodeStatus === "success";
    const isError = nodeStatus === "error";

    const operation = data.config?.operation || "create";

    const getBorderColor = () => {
        if (isLoading) return "#3b82f6";
        if (isSuccess) return "#22c55e";
        if (isError) return "#ef4444";
        if (selected) return "#3b82f6";
        return isDark ? "#374151" : "#e5e7eb";
    };

    const handleTrigger = (e) => {
        e.stopPropagation();
        if (data.onTrigger) {
            data.onTrigger(id, data);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (data.onDelete) {
            data.onDelete(id);
        }
    };

    return (
        <div
            className="google-calendar-node"
            style={{
                background: isDark ? "#1f2937" : "#ffffff",
                border: `2px solid ${getBorderColor()}`,
                borderRadius: "16px",
                minWidth: "240px",
                boxShadow: isLoading
                    ? `0 0 20px ${getBorderColor()}40`
                    : "0 4px 12px rgba(0, 0, 0, 0.08)",
                overflow: "visible",
                position: "relative",
                transition: "box-shadow 0.2s, border-color 0.2s",
            }}
        >
            {/* Loading shimmer */}
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "14px",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "200%",
                            height: "100%",
                            background:
                                "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)",
                            animation: "shimmer 1.5s infinite",
                        }}
                    />
                </div>
            )}

            {/* Main Input Handle - Top (accepts multiple connections) */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                isConnectable={true}
                style={{
                    background: isDark ? "#374151" : "#ffffff",
                    width: "16px",
                    height: "16px",
                    border: `2px solid ${getBorderColor()}`,
                    left: "50%",
                    top: "-9px",
                    transform: "translateX(-50%)",
                }}
            />

            {/* Output Handle - Bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                style={{
                    background: isDark ? "#374151" : "#ffffff",
                    width: "14px",
                    height: "14px",
                    border: `2px solid ${getBorderColor()}`,
                    left: "50%",
                    bottom: "-8px",
                    transform: "translateX(-50%)",
                }}
            />

            {/* Content */}
            <div style={{ padding: "16px 20px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {isLoading ? (
                            <svg
                                className="w-6 h-6 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                            >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        ) : isSuccess ? (
                            <svg
                                className="w-6 h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="2.5"
                            >
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        ) : isError ? (
                            <svg
                                className="w-6 h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2.5"
                            >
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            icon && icon(isDark ? "#9ca3af" : "#374151")
                        )}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontWeight: "600",
                                fontSize: "16px",
                                color: isDark ? "#f9fafb" : "#111827",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {data.label}
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: isDark ? "#9ca3af" : "#6b7280",
                                marginTop: "2px",
                            }}
                        >
                            <span
                                style={{
                                    padding: "2px 6px",
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    borderRadius: "4px",
                                    textTransform: "capitalize",
                                }}
                            >
                                {operation}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {!isLoading && (
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                flexShrink: 0,
                            }}
                        >
                            {data.onTrigger && (
                                <button
                                    onClick={handleTrigger}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "#3b82f6",
                                        color: "#fff",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background 0.15s",
                                    }}
                                    title="Run"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            "#2563eb";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "#3b82f6";
                                    }}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                </button>
                            )}
                            {data.onDelete && (
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "6px",
                                        border: `1.5px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                                        background: "transparent",
                                        color: isDark ? "#9ca3af" : "#374151",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.15s",
                                    }}
                                    title="Delete"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            "#fee2e2";
                                        e.currentTarget.style.borderColor =
                                            "#ef4444";
                                        e.currentTarget.style.color = "#ef4444";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "transparent";
                                        e.currentTarget.style.borderColor =
                                            isDark ? "#4b5563" : "#d1d5db";
                                        e.currentTarget.style.color = isDark
                                            ? "#9ca3af"
                                            : "#374151";
                                    }}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoogleCalendarNode;
