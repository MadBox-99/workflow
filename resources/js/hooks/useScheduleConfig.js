import { defaultScheduleConfig } from "@/constants/scheduleDefaults";

export const useScheduleConfig = (config, onChange) => {
    const scheduleConfig = config.schedule || defaultScheduleConfig;

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

    return {
        scheduleConfig,
        handleScheduleToggle,
        handleTypeChange,
        handleIntervalChange,
        handleCronChange,
    };
};
