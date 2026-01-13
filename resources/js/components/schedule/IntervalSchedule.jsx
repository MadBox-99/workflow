import React from "react";

const IntervalSchedule = ({ interval, onChange }) => {
    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3 space-y-3">
            <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-400">
                Interval Settings
            </h5>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Seconds
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="60"
                        value={interval.seconds}
                        onChange={(e) => onChange("seconds", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        0-60
                    </span>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Minutes
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="60"
                        value={interval.minutes}
                        onChange={(e) => onChange("minutes", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        0-60
                    </span>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Hours
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="24"
                        value={interval.hours}
                        onChange={(e) => onChange("hours", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        0-24
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-300 dark:border-blue-600">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                    Runs every:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400 font-mono">
                    {interval.hours > 0 && `${interval.hours}h `}
                    {interval.minutes > 0 && `${interval.minutes}m `}
                    {interval.seconds > 0 && `${interval.seconds}s`}
                    {interval.hours === 0 &&
                        interval.minutes === 0 &&
                        interval.seconds === 0 &&
                        "Not set"}
                </p>
            </div>
        </div>
    );
};

export default IntervalSchedule;
