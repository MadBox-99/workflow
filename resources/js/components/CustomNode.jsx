import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, selected }) => {
    const nodeType = data.type || 'action';

    const typeStyles = {
        start: {
            bg: '#dcfce7',
            border: '#22c55e',
            icon: '▶'
        },
        action: {
            bg: '#dbeafe',
            border: '#3b82f6',
            icon: '⚙'
        },
        condition: {
            bg: '#fef9c3',
            border: '#eab308',
            icon: '?'
        },
        end: {
            bg: '#fee2e2',
            border: '#ef4444',
            icon: '◼'
        },
    };

    const style = typeStyles[nodeType] || typeStyles.action;

    return (
        <div
            style={{
                background: style.bg,
                border: `2px solid ${selected ? '#000' : style.border}`,
                borderRadius: '8px',
                padding: '12px',
                minWidth: '150px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                position: 'relative',
                boxShadow: selected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
            }}
        >
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />

            {/* Top-Left Corner Handle */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-left"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                    left: '0',
                    top: '0',
                }}
            />

            {/* Top-Right Corner Handle */}
            <Handle
                type="source"
                position={Position.Top}
                id="top-right"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                    right: '0',
                    top: '0',
                    left: 'auto',
                }}
            />

            {/* Right Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />

            {/* Bottom Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />

            {/* Bottom-Left Corner Handle */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-left"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                    left: '0',
                    bottom: '0',
                }}
            />

            {/* Bottom-Right Corner Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-right"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                    right: '0',
                    bottom: '0',
                    left: 'auto',
                }}
            />

            {/* Left Handle */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />

            <div className="flex items-center gap-2">
                <span style={{ fontSize: '18px' }}>{style.icon}</span>
                <div className="flex-1">
                    <div style={{ fontWeight: '600' }}>{data.label}</div>
                    {data.description && (
                        <div
                            style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                marginTop: '4px'
                            }}
                        >
                            {data.description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomNode;
