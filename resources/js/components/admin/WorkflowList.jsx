import React from "react";

const WorkflowList = ({ workflows, loading, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Workflows
                </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No workflows yet. Create one to get started!
                    </div>
                ) : (
                    workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {workflow.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {workflow.description}
                                </p>
                                <span
                                    className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                                        workflow.is_active
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                    }`}
                                >
                                    {workflow.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(workflow)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(workflow.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkflowList;
