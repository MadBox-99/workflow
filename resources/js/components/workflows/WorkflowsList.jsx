import React from 'react';

const WorkflowsList = ({ workflows, loading, onViewWorkflow }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Workflows</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : workflows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No active workflows available
                    </div>
                ) : (
                    workflows.map((workflow) => (
                        <div key={workflow.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{workflow.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{workflow.description}</p>
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="mr-4">Nodes: {workflow.nodes?.length || 0}</span>
                                    <span>Connections: {workflow.connections?.length || 0}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onViewWorkflow(workflow)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                View
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkflowsList;
