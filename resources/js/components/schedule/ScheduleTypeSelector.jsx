import React from "react";

const ScheduleTypeSelector = ({ selectedType, onTypeChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Schedule Type
            </label>
            <div className="space-y-2">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="schedule-type"
                        value="interval"
                        checked={selectedType === "interval"}
                        onChange={(e) => onTypeChange(e.target.value)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Fixed Interval</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name="schedule-type"
                        value="cron"
                        checked={selectedType === "cron"}
                        onChange={(e) => onTypeChange(e.target.value)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Advanced (Cron-like)
                    </span>
                </label>
            </div>
        </div>
    );
};

export default ScheduleTypeSelector;
