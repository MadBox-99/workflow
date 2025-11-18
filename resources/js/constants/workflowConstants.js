import { MarkerType } from '@xyflow/react';

export const nodeTypeConfig = {
    start: { label: 'Start', color: '#22c55e', bgColor: '#dcfce7' },
    action: { label: 'Action', color: '#3b82f6', bgColor: '#dbeafe' },
    condition: { label: 'Condition', color: '#eab308', bgColor: '#fef9c3' },
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
