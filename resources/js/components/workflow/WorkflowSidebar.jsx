import React from 'react';
import { nodeTypeConfig } from '@/constants/workflowConstants';

const WorkflowSidebar = ({ onDragStart }) => {
    return (
        <div className="w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                Node Types
            </h3>
            <div className="space-y-3">
                {Object.entries(nodeTypeConfig).map(([key, { label, bgColor, color }]) => (
                    <div
                        key={key}
                        draggable
                        onDragStart={(e) => onDragStart(e, key)}
                        className="cursor-move p-3 rounded-lg border-2 transition-all hover:shadow-md"
                        style={{
                            backgroundColor: bgColor,
                            borderColor: color,
                        }}
                    >
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Drag to canvas
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkflowSidebar;
