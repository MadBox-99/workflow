export const getNodeTypeStyles = (isDark) => ({
    start: {
        accent: '#22c55e',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    apiAction: {
        accent: '#3b82f6',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    emailAction: {
        accent: '#ec4899',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    databaseAction: {
        accent: '#8b5cf6',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    scriptAction: {
        accent: '#f59e0b',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    webhookAction: {
        accent: '#10b981',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    condition: {
        accent: '#eab308',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    constant: {
        accent: '#a855f7',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    template: {
        accent: '#0ea5e9',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    merge: {
        accent: '#14b8a6',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    end: {
        accent: '#ef4444',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    googleCalendarAction: {
        accent: '#4285f4',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
    googleDocsAction: {
        accent: '#4285f4',
        bg: isDark ? '#1f2937' : '#ffffff',
        border: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f9fafb' : '#111827',
        secondaryText: isDark ? '#9ca3af' : '#6b7280',
    },
});

// SVG Icons for each node type
export const nodeIcons = {
    start: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    apiAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
    ),
    emailAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 6L2 7" />
        </svg>
    ),
    databaseAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    scriptAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    webhookAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M18 16.98h-5.99c-1.1 0-1.95.68-2.95 1.76C8.07 19.83 6.51 21 4 21c-1.5 0-2.5-.5-3-1.5" />
            <path d="M9 10l3 3 3-3" />
            <circle cx="12" cy="5" r="3" />
        </svg>
    ),
    condition: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" />
        </svg>
    ),
    constant: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 15h6M9 12h6" />
        </svg>
    ),
    merge: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M6 3v6l6 3 6-3V3" />
            <path d="M12 12v9" />
        </svg>
    ),
    template: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" />
            <circle cx="19" cy="18" r="3" />
        </svg>
    ),
    end: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    googleCalendarAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    googleDocsAction: (color) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
};
