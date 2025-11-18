import React from 'react';

const NodeTriggerButton = ({ style, isDark, onTrigger }) => {
    return (
        <button
            onClick={onTrigger}
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
    );
};

export default NodeTriggerButton;
