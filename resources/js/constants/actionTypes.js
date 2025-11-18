// Action types configuration
// Easy to extend - just add new action types here

export const actionTypes = {
    apiCall: {
        id: 'apiCall',
        label: 'API Call',
        icon: '🌐',
        description: 'Make HTTP requests to external APIs',
        color: '#3b82f6',
    },
    database: {
        id: 'database',
        label: 'Database Query',
        icon: '🗄️',
        description: 'Execute database queries',
        color: '#8b5cf6',
    },
    email: {
        id: 'email',
        label: 'Send Email',
        icon: '📧',
        description: 'Send email notifications',
        color: '#ec4899',
    },
    script: {
        id: 'script',
        label: 'Run Script',
        icon: '⚡',
        description: 'Execute custom PHP/JavaScript code',
        color: '#f59e0b',
    },
    webhook: {
        id: 'webhook',
        label: 'Webhook',
        icon: '🔔',
        description: 'Trigger external webhooks',
        color: '#10b981',
    },
};

export const getActionTypeById = (id) => {
    return actionTypes[id] || actionTypes.apiCall;
};

export const getActionTypesList = () => {
    return Object.values(actionTypes);
};
