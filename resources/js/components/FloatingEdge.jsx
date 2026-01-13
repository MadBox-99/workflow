import React from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";

function FloatingEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    animated,
    selected,
}) {
    const [path] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 12,
    });

    // Base style - always dotted
    const baseStyle = {
        ...style,
        strokeLinecap: "round",
    };

    // Add animation when running
    if (animated) {
        baseStyle.animation = "flowAnimation 0.8s linear infinite";
        baseStyle.stroke = "#3b82f6";
        baseStyle.strokeWidth = 2;
        baseStyle.strokeDasharray = "4 4";
    }

    // Highlight when selected
    if (selected) {
        baseStyle.stroke = "#3b82f6";
        baseStyle.strokeWidth = 2;
        baseStyle.strokeDasharray = "0";
    }

    return (
        <BaseEdge id={id} path={path} markerEnd={markerEnd} style={baseStyle} />
    );
}

export default FloatingEdge;
