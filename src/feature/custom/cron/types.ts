/* Types */
import { FeatureOptions, FeatureType } from "../../../ts/base";

/* Options */
export type FeatureCronOptions = FeatureOptions & {
    type: FeatureType.CRON;
    intervals: CronInterval[];
};

export type CronInterval = {
    time: string;
    updates?: CronUpdate[];
    cleans?: CronClean[];
};

export enum CronStatisticType {
    MINUTE = "MINUTE",
    HOUR = "HOUR",
    DAY = "DAY",
    MONTH = "MONTH",
    YEAR = "YEAR"
};
export const CronStatisticPreviousMapping = {
    [CronStatisticType.MINUTE]: CronStatisticType.MINUTE,
    [CronStatisticType.HOUR]: CronStatisticType.MINUTE,
    [CronStatisticType.DAY]: CronStatisticType.HOUR,
    [CronStatisticType.MONTH]: CronStatisticType.DAY,
    [CronStatisticType.YEAR]: CronStatisticType.MONTH
};
export const CronStatisticNextMapping = {
    [CronStatisticType.MINUTE]: CronStatisticType.HOUR,
    [CronStatisticType.HOUR]: CronStatisticType.DAY,
    [CronStatisticType.DAY]: CronStatisticType.MONTH,
    [CronStatisticType.MONTH]: CronStatisticType.YEAR,
    [CronStatisticType.YEAR]: CronStatisticType.YEAR
};
export const CronStatisticTimeMapping = {
    [CronStatisticType.MINUTE]: 60,
    [CronStatisticType.HOUR]: 3600,
    [CronStatisticType.DAY]: 86400,
    [CronStatisticType.MONTH]: 2628000,
    [CronStatisticType.YEAR]: 31536000
};

/* Update */
export enum CronUpdateType {
    RESOURCES = "RESOURCES",
    STATISTICS = "STATISTICS",
    UPTIME_ENDPOINTS = "UPTIME_ENDPOINTS",
};

export enum CronUpdateResourcesType {
    GENERAL = "GENERAL",
    CONTAINERS = "CONTAINERS",
    DISKS = "DISKS"
};

export type CronUpdate = {
    type: CronUpdateType;
};
export type CronUpdateStatistics = CronUpdate & {
    resources: CronUpdateResourcesType[];
    statistic: CronStatisticType;
};
export type CronUpdateResources = CronUpdate & {
    resources: CronUpdateResourcesType[];
};

/* Clean */
export enum CronCleanType {
    STATISTICS = "STATISTICS",
    UPTIME_STATISTICS = "UPTIME_STATISTICS",
    TASKS = "TASKS"
};

export type CronClean = {
    type: CronCleanType;
    time: number;
    resources: CronUpdateResourcesType[];
    statistic: CronStatisticType;
};
