/* Types */
import { FeatureOptions, FeatureType } from "../../../ts/base";

/* Options */
export type FeatureCronOptions = FeatureOptions & {
    type: FeatureType.CRON;
    intervals: CronInterval[];
};

export type CronInterval = {
    time: string;
    updates: CronUpdate[];
    cleans: CronClean[];
};

export enum CronUpdateType {
    RESOURCES = "RESOURCES",
    STATISTICS = "STATISTICS",
    UPTIME_ENDPOINTS = "UPTIME_ENDPOINTS",
};

export type CronUpdate = CronUpdateType;

export enum CronCleanType {
    STATISTICS = "STATISTICS",
    UPTIME_STATISTICS = "UPTIME_STATISTICS"
};

export type CronClean = {
    type: CronCleanType;
    time: number;
};
