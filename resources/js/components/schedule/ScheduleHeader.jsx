import React from "react";

const ScheduleHeader = ({ enabled, onToggle }) => {
    return (
        <>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
                <h4 className="font-semibold text-sm mb-2 text-green-800 dark:text-green-400">
                    Start Node Scheduling
                </h4>
                <p className="text-xs text-green-600 dark:text-green-500">
                    Configure when this workflow should automatically start
                </p>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="schedule-enabled"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-4 h-4"
                />
                <label
                    htmlFor="schedule-enabled"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    Enable Automatic Scheduling
                </label>
            </div>
        </>
    );
};

export default ScheduleHeader;
