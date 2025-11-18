import { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { NodeStatusIndicator } from './node-status-indicator';

const CustomNode = ({ data, selected, id }) => {
    const nodeType = data.type || 'action';
    const nodeStatus = data.status || 'initial';
    const statusVariant = data.statusVariant || 'border';
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const handleTrigger = (e) => {
        e.stopPropagation();
        if (data.onTrigger) {
            data.onTrigger(id, data);
        }
    };

    const typeStyles = {
        start: {
            bg: isDark ? '#14532d' : '#dcfce7',
            border: isDark ? '#22c55e' : '#22c55e',
            icon: '▶',
            textColor: isDark ? '#86efac' : '#15803d'
        },
        action: {
            bg: isDark ? '#1e3a8a' : '#dbeafe',
            border: isDark ? '#3b82f6' : '#3b82f6',
            icon: '⚙',
            textColor: isDark ? '#93c5fd' : '#1e40af'
        },
        condition: {
            bg: isDark ? '#713f12' : '#fef9c3',
            border: isDark ? '#eab308' : '#eab308',
            icon: '?',
            textColor: isDark ? '#fde047' : '#854d0e'
        },
        end: {
            bg: isDark ? '#7f1d1d' : '#fee2e2',
            border: isDark ? '#ef4444' : '#ef4444',
            icon: '◼',
            textColor: isDark ? '#fca5a5' : '#991b1b'
        },
    };

    const style = typeStyles[nodeType] || typeStyles.action;

    return (
        <NodeStatusIndicator status={nodeStatus} variant={statusVariant}>
            <NodeResizer
                color={style.border}
                isVisible={selected}
                minWidth={150}
                minHeight={60}
                handleStyle={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                }}
                lineStyle={{
                    borderWidth: '2px',
                }}
            />
            <div
                style={{
                    background: style.bg,
                    border: `2px solid ${selected ? (isDark ? '#fff' : '#000') : style.border}`,
                    borderRadius: '8px',
                    padding: '12px',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: style.textColor,
                    position: 'relative',
                    boxShadow: selected ? (isDark ? '0 4px 6px -1px rgba(255, 255, 255, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)') : 'none',
                }}
            >
            {/* Top Handles - source overlaid on target so both work from same position */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-source"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />

            {/* Right Handles - source overlaid on target */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-source"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />

            {/* Bottom Handles - source overlaid on target */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />

            {/* Left Handles - source overlaid on target */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                style={{
                    background: style.border,
                    width: '10px',
                    height: '10px',
                    border: `2px solid ${style.bg}`,
                }}
            />

            {/* Trigger Button - Top Right Corner */}
            <button
                onClick={handleTrigger}
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: `1px solid ${style.border}`,
                    background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                    color: style.textColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                    zIndex: 10,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = style.border;
                    e.currentTarget.style.color = isDark ? '#000' : '#fff';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.color = style.textColor;
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Trigger Event"
            >
                ▶
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span style={{ fontSize: '18px' }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{data.label}</div>
                    {data.description && (
                        <div
                            style={{
                                fontSize: '11px',
                                color: isDark ? '#9ca3af' : '#6b7280',
                                marginTop: '4px'
                            }}
                        >
                            {data.description}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </NodeStatusIndicator>
    );
};

export default CustomNode;
