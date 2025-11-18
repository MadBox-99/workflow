export const getNodeTypeStyles = (isDark) => ({
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
    constant: {
        bg: isDark ? '#5b21b6' : '#ede9fe',
        border: isDark ? '#8b5cf6' : '#8b5cf6',
        icon: '📊',
        textColor: isDark ? '#c4b5fd' : '#6b21a8'
    },
    end: {
        bg: isDark ? '#7f1d1d' : '#fee2e2',
        border: isDark ? '#ef4444' : '#ef4444',
        icon: '◼',
        textColor: isDark ? '#fca5a5' : '#991b1b'
    },
});
