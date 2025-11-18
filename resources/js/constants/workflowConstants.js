import { MarkerType } from '@xyflow/react';

export const nodeTypeConfig = {
    start: { label: 'Start', color: '#22c55e', bgColor: '#dcfce7' },
    apiAction: { label: 'API Action', color: '#3b82f6', bgColor: '#dbeafe' },
    emailAction: { label: 'Email Action', color: '#ec4899', bgColor: '#fce7f3' },
    databaseAction: { label: 'Database Action', color: '#8b5cf6', bgColor: '#ede9fe' },
    scriptAction: { label: 'Script Action', color: '#f59e0b', bgColor: '#fef3c7' },
    webhookAction: { label: 'Webhook Action', color: '#10b981', bgColor: '#d1fae5' },
    condition: { label: 'Condition', color: '#eab308', bgColor: '#fef9c3' },
    constant: { label: 'Constant', color: '#a855f7', bgColor: '#f3e8ff' },
    end: { label: 'End', color: '#ef4444', bgColor: '#fee2e2' },
};

export const defaultEdgeOptions = {
    type: 'floating',
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
    },
    style: {
        strokeWidth: 2,
    },
};
