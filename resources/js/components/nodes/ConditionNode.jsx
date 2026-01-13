import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { nodeIcons } from "@/constants/nodeStyles";

const ConditionNode = ({ data, selected, id }) => {
    const isDark = useDarkMode();
    const nodeStatus = data.status || "initial";
    const icon = nodeIcons.condition;

    const isLoading = nodeStatus === "loading";
    const isSuccess = nodeStatus === "success";
    const isError = nodeStatus === "error";

    // Get condition result and config
    const conditionResult = data.conditionResult;
    const operator = data.config?.operator || "equals";
    const passWhen = data.config?.passWhen || "true";
    const hasResult = conditionResult !== undefined;

    // Operator display labels
    const operatorLabels = {
        equals: "=",
        strictEquals: "===",
        notEquals: "≠",
        greaterThan: ">",
        lessThan: "<",
        greaterOrEqual: "≥",
        lessOrEqual: "≤",
        contains: "∈",
        isEmpty: "∅",
        isNotEmpty: "∃",
        isTrue: "?T",
        isFalse: "?F",
    };

    const getBorderColor = () => {
        if (isLoading) return "#3b82f6";
        if (isSuccess) return "#22c55e";
        if (isError) return "#ef4444";
        if (selected) return "#f59e0b";
        return isDark ? "#374151" : "#e5e7eb";
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (data.onDelete) {
            data.onDelete(id);
        }
    };

    // Determine if condition passed (would continue to output)
    const conditionPassed =
        hasResult &&
        ((passWhen === "true" && conditionResult === true) ||
            (passWhen === "false" && conditionResult === false));

    return (
        <div
            className="condition-node"
            style={{
                background: isDark ? "#1f2937" : "#ffffff",
                border: `2px solid ${getBorderColor()}`,
                borderRadius: "16px",
                minWidth: "220px",
                boxShadow: isLoading
                    ? `0 0 20px ${getBorderColor()}40`
                    : "0 4px 12px rgba(0, 0, 0, 0.08)",
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
                                "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent)",
                            animation: "shimmer 1.5s infinite",
                        }}
                    />
                </div>
            )}

            {/* Input Handle A - positioned at 33% */}
            <Handle
                type="target"
                position={Position.Top}
                id="input-a"
                style={{
                    background: isDark ? "#374151" : "#ffffff",
                    width: "14px",
                    height: "14px",
                    border: `2px solid ${getBorderColor()}`,
                    left: "33%",
                    top: "-8px",
                    transform: "translateX(-50%)",
                }}
            />

            {/* Input Handle B - positioned at 66% */}
            <Handle
                type="target"
                position={Position.Top}
                id="input-b"
                style={{
                    background: isDark ? "#374151" : "#ffffff",
                    width: "14px",
                    height: "14px",
                    border: `2px solid ${getBorderColor()}`,
                    left: "66%",
                    top: "-8px",
                    transform: "translateX(-50%)",
                }}
            />

            {/* Single Output Handle - Center Bottom */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="output"
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
                            icon && icon(isDark ? "#fbbf24" : "#f59e0b")
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
                            {data.label || "Condition"}
                        </div>
                        <div
                            style={{
                                fontSize: "11px",
                                color: isDark ? "#9ca3af" : "#6b7280",
                                marginTop: "2px",
                            }}
                        >
                            2 inputs
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        {data.onTrigger && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    data.onTrigger(id, data);
                                }}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "#f59e0b",
                                    color: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                title="Run"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
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
                                }}
                                title="Delete"
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
                </div>

                {/* Condition preview */}
                <div
                    style={{
                        marginTop: "10px",
                        padding: "8px 10px",
                        background: isDark ? "#374151" : "#fef3c7",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: isDark ? "#fcd34d" : "#92400e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>
                        A {operatorLabels[operator] || "?"} B
                    </span>
                    <span
                        style={{
                            padding: "2px 8px",
                            background:
                                passWhen === "true"
                                    ? isDark
                                        ? "rgba(34, 197, 94, 0.3)"
                                        : "#dcfce7"
                                    : isDark
                                      ? "rgba(239, 68, 68, 0.3)"
                                      : "#fee2e2",
                            borderRadius: "4px",
                            fontWeight: "600",
                            fontSize: "10px",
                            color: passWhen === "true" ? "#22c55e" : "#ef4444",
                        }}
                    >
                        Pass: {passWhen.toUpperCase()}
                    </span>
                </div>

                {/* Result indicator */}
                {hasResult && (
                    <div
                        style={{
                            marginTop: "6px",
                            padding: "6px 10px",
                            background: conditionPassed
                                ? isDark
                                    ? "rgba(34, 197, 94, 0.2)"
                                    : "#dcfce7"
                                : isDark
                                  ? "rgba(239, 68, 68, 0.2)"
                                  : "#fee2e2",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "500",
                            color: conditionPassed ? "#22c55e" : "#ef4444",
                            textAlign: "center",
                        }}
                    >
                        {conditionPassed ? "→ Passed to output" : "✕ Blocked"}
                    </div>
                )}

                {/* Handle labels */}
                <div
                    style={{
                        marginTop: "8px",
                        display: "flex",
                        justifyContent: "center",
                        gap: "24px",
                        fontSize: "10px",
                    }}
                >
                    <span style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>A</span>
                    <span style={{ color: isDark ? "#a78bfa" : "#8b5cf6" }}>B</span>
                </div>
            </div>
        </div>
    );
};

export default ConditionNode;
