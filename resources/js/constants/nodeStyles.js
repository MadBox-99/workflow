export const getNodeTypeStyles = (isDark) => ({
    start: {
        bg: isDark ? '#14532d' : '#dcfce7',
        border: isDark ? '#22c55e' : '#22c55e',
        icon: '▶',
        textColor: isDark ? '#86efac' : '#15803d'
    },
    apiAction: {
        bg: isDark ? '#1e3a8a' : '#dbeafe',
        border: isDark ? '#3b82f6' : '#3b82f6',
        icon: '🌐',
        textColor: isDark ? '#93c5fd' : '#1e40af'
    },
    emailAction: {
        bg: isDark ? '#831843' : '#fce7f3',
        border: isDark ? '#ec4899' : '#ec4899',
        icon: '📧',
        textColor: isDark ? '#f9a8d4' : '#9d174d'
    },
    databaseAction: {
        bg: isDark ? '#5b21b6' : '#ede9fe',
        border: isDark ? '#8b5cf6' : '#8b5cf6',
        icon: '🗄️',
        textColor: isDark ? '#c4b5fd' : '#6b21a8'
    },
    scriptAction: {
        bg: isDark ? '#78350f' : '#fef3c7',
        border: isDark ? '#f59e0b' : '#f59e0b',
        icon: '⚡',
        textColor: isDark ? '#fcd34d' : '#92400e'
    },
    webhookAction: {
        bg: isDark ? '#064e3b' : '#d1fae5',
        border: isDark ? '#10b981' : '#10b981',
        icon: '🔔',
        textColor: isDark ? '#6ee7b7' : '#065f46'
    },
    condition: {
        bg: isDark ? '#713f12' : '#fef9c3',
        border: isDark ? '#eab308' : '#eab308',
        icon: '?',
        textColor: isDark ? '#fde047' : '#854d0e'
    },
    constant: {
        bg: isDark ? '#6b21a8' : '#f3e8ff',
        border: isDark ? '#a855f7' : '#a855f7',
        icon: '📊',
        textColor: isDark ? '#e9d5ff' : '#7e22ce'
    },
    end: {
        bg: isDark ? '#7f1d1d' : '#fee2e2',
        border: isDark ? '#ef4444' : '#ef4444',
        icon: '◼',
        textColor: isDark ? '#fca5a5' : '#991b1b'
    },
});
