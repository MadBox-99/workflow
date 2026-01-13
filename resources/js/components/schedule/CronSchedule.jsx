import React from "react";

const CronSchedule = ({ cron, onChange }) => {
    return (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded p-3 space-y-3">
            <h5 className="font-semibold text-sm text-purple-800 dark:text-purple-400">
                Cron-like Schedule
            </h5>

            <div className="space-y-2">
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Minute (0-59 or *)
                    </label>
                    <input
                        type="text"
                        value={cron.minute}
                        onChange={(e) => onChange("minute", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="* or 0-59"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Hour (0-23 or *)
                    </label>
                    <input
                        type="text"
                        value={cron.hour}
                        onChange={(e) => onChange("hour", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="* or 0-23"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Day of Month (1-31 or *)
                    </label>
                    <input
                        type="text"
                        value={cron.dayOfMonth}
                        onChange={(e) => onChange("dayOfMonth", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="* or 1-31"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Month (1-12 or *)
                    </label>
                    <input
                        type="text"
                        value={cron.month}
                        onChange={(e) => onChange("month", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="* or 1-12"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Day of Week (0-6 or *, 0=Sunday)
                    </label>
                    <input
                        type="text"
                        value={cron.dayOfWeek}
                        onChange={(e) => onChange("dayOfWeek", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="* or 0-6"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-300 dark:border-purple-600">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-300">
                    Cron Expression:
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-400 font-mono">
                    {cron.minute} {cron.hour} {cron.dayOfMonth} {cron.month} {cron.dayOfWeek}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    * = any value | Numbers = specific value | Ranges: 1-5 | Lists: 1,3,5
                </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                    <strong>Examples:</strong>
                    <br />• Every day at 9 AM:{" "}
                    <code className="bg-white dark:bg-gray-700 px-1">0 9 * * *</code>
                    <br />• Every Monday at 8:30 AM:{" "}
                    <code className="bg-white dark:bg-gray-700 px-1">30 8 * * 1</code>
                    <br />• First day of month:{" "}
                    <code className="bg-white dark:bg-gray-700 px-1">0 0 1 * *</code>
                </p>
            </div>
        </div>
    );
};

export default CronSchedule;
