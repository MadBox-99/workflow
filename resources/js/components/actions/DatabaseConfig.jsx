import React from "react";

const DatabaseConfig = ({ config, onChange }) => {
    return (
        <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded p-3">
                <p className="text-sm text-purple-800 dark:text-purple-400">
                    🚧 Database Query configuration coming soon...
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                    This will allow you to execute database queries directly from the workflow.
                </p>
            </div>
        </div>
    );
};

export default DatabaseConfig;
