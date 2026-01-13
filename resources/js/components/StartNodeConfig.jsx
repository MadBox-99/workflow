import React from "react";
import ScheduleHeader from "./schedule/ScheduleHeader";
import ScheduleTypeSelector from "./schedule/ScheduleTypeSelector";
import IntervalSchedule from "./schedule/IntervalSchedule";
import CronSchedule from "./schedule/CronSchedule";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";

const StartNodeConfig = ({ config, onChange }) => {
    const {
        scheduleConfig,
        handleScheduleToggle,
        handleTypeChange,
        handleIntervalChange,
        handleCronChange,
    } = useScheduleConfig(config, onChange);

    return (
        <div className="space-y-4">
            <ScheduleHeader
                enabled={scheduleConfig.enabled}
                onToggle={handleScheduleToggle}
            />

            {scheduleConfig.enabled && (
                <>
                    <ScheduleTypeSelector
                        selectedType={scheduleConfig.type}
                        onTypeChange={handleTypeChange}
                    />

                    {scheduleConfig.type === "interval" && (
                        <IntervalSchedule
                            interval={scheduleConfig.interval}
                            onChange={handleIntervalChange}
                        />
                    )}

                    {scheduleConfig.type === "cron" && (
                        <CronSchedule
                            cron={scheduleConfig.cron}
                            onChange={handleCronChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default StartNodeConfig;
