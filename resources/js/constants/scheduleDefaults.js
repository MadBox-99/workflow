export const defaultScheduleConfig = {
    enabled: false,
    type: "interval",
    interval: {
        seconds: 0,
        minutes: 0,
        hours: 0,
    },
    cron: {
        minute: "*",
        hour: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*",
    },
};
