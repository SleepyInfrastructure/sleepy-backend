/* Types */
import { FeatureOptions } from "feature/types";

/* Options */
export type FeatureCronOptions = FeatureOptions & {
    intervals: CronInterval[];
};

export type CronInterval = {
    time: string;
    updates?: CronUpdate[];
    cleans?: CronClean[];
};

/* Update */
export enum CronUpdateType {
    RESOURCES = "RESOURCES",
    STATISTICS = "STATISTICS",
    UPTIME_ENDPOINTS = "UPTIME_ENDPOINTS",
    ALERTS = "ALERTS",
};

export enum CronUpdateResourcesType {
    GENERAL = "GENERAL",
    CONTAINERS = "CONTAINERS",
    DISKS = "DISKS",
    PROCESSES = "PROCESSES"
};

export type CronUpdate = {
    type: CronUpdateType;
};
export type CronUpdateStatistics = CronUpdate & {
    resources: CronUpdateResourcesType[];
    statistic: StatisticType;
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
    statistic: StatisticType;
};
