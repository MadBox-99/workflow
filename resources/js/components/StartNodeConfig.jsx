import React from 'react';

const StartNodeConfig = ({ config, onChange }) => {
    const scheduleConfig = config.schedule || {
        enabled: false,
        type: 'interval',
        interval: {
            seconds: 0,
            minutes: 0,
            hours: 0,
        },
        cron: {
            minute: '*',
            hour: '*',
            dayOfMonth: '*',
            month: '*',
            dayOfWeek: '*',
        },
    };

    const handleScheduleToggle = (enabled) => {
        onChange({
            ...config,
            schedule: {
                ...scheduleConfig,
                enabled,
            },
        });
    };

    const handleTypeChange = (type) => {
        onChange({
            ...config,
            schedule: {
                ...scheduleConfig,
                type,
            },
        });
    };

    const handleIntervalChange = (field, value) => {
        onChange({
            ...config,
            schedule: {
                ...scheduleConfig,
                interval: {
                    ...scheduleConfig.interval,
                    [field]: parseInt(value) || 0,
                },
            },
        });
    };

    const handleCronChange = (field, value) => {
        onChange({
            ...config,
            schedule: {
                ...scheduleConfig,
                cron: {
                    ...scheduleConfig.cron,
                    [field]: value,
                },
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-3">
                <h4 className="font-semibold text-sm mb-2 text-green-800">Start Node Scheduling</h4>
                <p className="text-xs text-green-600">
                    Configure when this workflow should automatically start
                </p>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="schedule-enabled"
                    checked={scheduleConfig.enabled}
                    onChange={(e) => handleScheduleToggle(e.target.checked)}
                    className="w-4 h-4"
                />
                <label htmlFor="schedule-enabled" className="text-sm font-medium">
                    Enable Automatic Scheduling
                </label>
            </div>

            {scheduleConfig.enabled && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">Schedule Type</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="schedule-type"
                                    value="interval"
                                    checked={scheduleConfig.type === 'interval'}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                />
                                <span className="text-sm">Fixed Interval</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="schedule-type"
                                    value="cron"
                                    checked={scheduleConfig.type === 'cron'}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                />
                                <span className="text-sm">Advanced (Cron-like)</span>
                            </label>
                        </div>
                    </div>

                    {scheduleConfig.type === 'interval' && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-3">
                            <h5 className="font-semibold text-sm text-blue-800">Interval Settings</h5>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Seconds</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={scheduleConfig.interval.seconds}
                                        onChange={(e) => handleIntervalChange('seconds', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-xs text-gray-500">0-60</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Minutes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={scheduleConfig.interval.minutes}
                                        onChange={(e) => handleIntervalChange('minutes', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-xs text-gray-500">0-60</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Hours</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={scheduleConfig.interval.hours}
                                        onChange={(e) => handleIntervalChange('hours', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-xs text-gray-500">0-24</span>
                                </div>
                            </div>

                            <div className="bg-white p-2 rounded border border-blue-300">
                                <p className="text-xs font-medium text-blue-900">Runs every:</p>
                                <p className="text-sm text-blue-800 font-mono">
                                    {scheduleConfig.interval.hours > 0 && `${scheduleConfig.interval.hours}h `}
                                    {scheduleConfig.interval.minutes > 0 && `${scheduleConfig.interval.minutes}m `}
                                    {scheduleConfig.interval.seconds > 0 && `${scheduleConfig.interval.seconds}s`}
                                    {scheduleConfig.interval.hours === 0 &&
                                     scheduleConfig.interval.minutes === 0 &&
                                     scheduleConfig.interval.seconds === 0 && 'Not set'}
                                </p>
                            </div>
                        </div>
                    )}

                    {scheduleConfig.type === 'cron' && (
                        <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-3">
                            <h5 className="font-semibold text-sm text-purple-800">Cron-like Schedule</h5>

                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Minute (0-59 or *)
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleConfig.cron.minute}
                                        onChange={(e) => handleCronChange('minute', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        placeholder="* or 0-59"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Hour (0-23 or *)
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleConfig.cron.hour}
                                        onChange={(e) => handleCronChange('hour', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        placeholder="* or 0-23"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Day of Month (1-31 or *)
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleConfig.cron.dayOfMonth}
                                        onChange={(e) => handleCronChange('dayOfMonth', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        placeholder="* or 1-31"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Month (1-12 or *)
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleConfig.cron.month}
                                        onChange={(e) => handleCronChange('month', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        placeholder="* or 1-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Day of Week (0-6 or *, 0=Sunday)
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleConfig.cron.dayOfWeek}
                                        onChange={(e) => handleCronChange('dayOfWeek', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        placeholder="* or 0-6"
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-2 rounded border border-purple-300">
                                <p className="text-xs font-medium text-purple-900">Cron Expression:</p>
                                <p className="text-sm text-purple-800 font-mono">
                                    {scheduleConfig.cron.minute} {scheduleConfig.cron.hour} {scheduleConfig.cron.dayOfMonth} {scheduleConfig.cron.month} {scheduleConfig.cron.dayOfWeek}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    * = any value | Numbers = specific value | Ranges: 1-5 | Lists: 1,3,5
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <p className="text-xs text-yellow-800">
                                    <strong>Examples:</strong><br/>
                                    • Every day at 9 AM: <code className="bg-white px-1">0 9 * * *</code><br/>
                                    • Every Monday at 8:30 AM: <code className="bg-white px-1">30 8 * * 1</code><br/>
                                    • First day of month: <code className="bg-white px-1">0 0 1 * *</code>
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StartNodeConfig;
