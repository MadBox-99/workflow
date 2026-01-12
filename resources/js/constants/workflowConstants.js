import { MarkerType } from '@xyflow/react';

export const nodeTypeConfig = {
    start: { label: 'Start', color: '#22c55e', bgColor: '#dcfce7' },
    apiAction: { label: 'API Action', color: '#3b82f6', bgColor: '#dbeafe' },
    emailAction: { label: 'Email Action', color: '#ec4899', bgColor: '#fce7f3' },
    databaseAction: { label: 'Database Action', color: '#8b5cf6', bgColor: '#ede9fe' },
    scriptAction: { label: 'Script Action', color: '#f59e0b', bgColor: '#fef3c7' },
    webhookAction: { label: 'Webhook Action', color: '#10b981', bgColor: '#d1fae5' },
    googleCalendarAction: { label: 'Google Calendar', color: '#4285f4', bgColor: '#e8f0fe' },
    googleDocsAction: { label: 'Google Docs', color: '#4285f4', bgColor: '#e8f0fe' },
    condition: { label: 'Condition', color: '#eab308', bgColor: '#fef9c3' },
    constant: { label: 'Constant', color: '#a855f7', bgColor: '#f3e8ff' },
    template: { label: 'Template', color: '#0ea5e9', bgColor: '#e0f2fe' },
    merge: { label: 'Merge', color: '#14b8a6', bgColor: '#ccfbf1' },
    branch: { label: 'Branch', color: '#f97316', bgColor: '#ffedd5' },
    join: { label: 'Join', color: '#06b6d4', bgColor: '#cffafe' },
    end: { label: 'End', color: '#ef4444', bgColor: '#fee2e2' },
};

export const defaultEdgeOptions = {
    type: 'floating',
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#9ca3af',
    },
    style: {
        strokeWidth: 1.5,
        stroke: '#9ca3af',
        strokeDasharray: '6 4',
    },
};
