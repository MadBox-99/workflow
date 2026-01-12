import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useDarkMode } from '@/hooks/useDarkMode';

const TemplateNode = ({ data, selected, id }) => {
    const isDark = useDarkMode();
    const inputs = data.inputs || ['input-1', 'input-2'];
    const nodeStatus = data.status || 'initial';
    const template = data.config?.template ?? '';

    const isLoading = nodeStatus === 'loading';
    const isSuccess = nodeStatus === 'success';
    const isError = nodeStatus === 'error';

    const getBorderColor = () => {
        if (isLoading) return '#3b82f6';
        if (isSuccess) return '#22c55e';
        if (isError) return '#ef4444';
        if (selected) return '#0ea5e9';
        return isDark ? '#374151' : '#e5e7eb';
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (data.onDelete) {
            data.onDelete(id);
        }
    };

    // Display template preview
    const getTemplatePreview = () => {
        if (!template) return 'No template';
        if (template.length > 30) return template.substring(0, 30) + '...';
        return template;
    };

    return (
        <div
            className="template-node"
            style={{
                background: isDark ? '#1f2937' : '#ffffff',
                border: `2px solid ${getBorderColor()}`,
                borderRadius: '16px',
                minWidth: '220px',
                boxShadow: isLoading
                    ? `0 0 20px ${getBorderColor()}40`
                    : '0 4px 12px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                transition: 'box-shadow 0.2s, border-color 0.2s',
            }}
        >
            {/* Loading shimmer */}
            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '14px',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '200%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.1), transparent)',
                            animation: 'shimmer 1.5s infinite',
                        }}
                    />
                </div>
            )}

            {/* Input Handles - Top */}
            {inputs.map((inputId, index) => {
                const totalInputs = inputs.length;
                const spacing = 100 / (totalInputs + 1);
                const leftPercent = spacing * (index + 1);

                return (
                    <Handle
                        key={inputId}
                        type="target"
                        position={Position.Top}
                        id={inputId}
                        style={{
                            background: isDark ? '#374151' : '#ffffff',
                            width: '14px',
                            height: '14px',
                            border: `2px solid ${getBorderColor()}`,
                            left: `${leftPercent}%`,
                            top: '-8px',
                            transform: 'translateX(-50%)',
                        }}
                    />
                );
            })}

            {/* Output Handle - Bottom Center */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                style={{
                    background: isDark ? '#374151' : '#ffffff',
                    width: '14px',
                    height: '14px',
                    border: `2px solid ${getBorderColor()}`,
                    left: '50%',
                    bottom: '-8px',
                    transform: 'translateX(-50%)',
                }}
            />

            {/* Content */}
            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Icon */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        ) : isError ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#38bdf8' : '#0ea5e9'} strokeWidth="1.5">
                                <path d="M4 6h16M4 12h16M4 18h10" />
                                <circle cx="19" cy="18" r="3" />
                            </svg>
                        )}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontWeight: '600',
                                fontSize: '16px',
                                color: isDark ? '#f9fafb' : '#111827',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {data.label || 'Template'}
                        </div>
                        <div
                            style={{
                                fontSize: '11px',
                                color: isDark ? '#9ca3af' : '#6b7280',
                                marginTop: '2px',
                            }}
                        >
                            {inputs.length} inputs
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {data.onTrigger && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    data.onTrigger(id, data);
                                }}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#0ea5e9',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
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
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: `1.5px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                                    background: 'transparent',
                                    color: isDark ? '#9ca3af' : '#374151',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="Delete"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Template preview */}
                <div
                    style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        background: isDark ? '#374151' : '#e0f2fe',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: isDark ? '#7dd3fc' : '#0369a1',
                        fontFamily: 'monospace',
                    }}
                >
                    {getTemplatePreview()}
                </div>
            </div>
        </div>
    );
};

export default TemplateNode;
