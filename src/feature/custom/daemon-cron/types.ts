/* Types */
import { FeatureOptions, FeatureType } from "../../../ts/base";

/* Options */
export type FeatureDaemonCronOptions = FeatureOptions & {
    type: FeatureType.DAEMON_CRON;
    intervals: DaemonCronInterval[];
};

export type DaemonCronInterval = {
    time: string;
    updates: DaemonCronUpdate[];
    cleans: DaemonCronClean[];
};

export enum DaemonCronUpdateType {
    REFRESH = "REFRESH",
    STATS = "STATS",
    REALTIME_STATS = "REALTIME_STATS"
};

export type DaemonCronUpdate = DaemonCronUpdateType;

export enum DaemonCronCleanType {
    STATS = "STATS"
};

export type DaemonCronClean = {
    type: DaemonCronCleanType;
    time: number;
};
