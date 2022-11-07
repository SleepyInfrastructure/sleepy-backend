import Instance from "instance";
import Feature from "feature";
import { FeatureOptions } from "feature/types";
import FeatureCron from "./cron";
import FeatureDaemon from "./daemon";
import { FeatureCronOptions } from "./cron/types";
import { FeatureDaemonOptions } from "./daemon/types";

export enum CustomFeatureType {
    CRON = "CRON",
    DAEMON = "DAEMON"
}

const features: Record<CustomFeatureType, (parent: Instance, options: FeatureOptions) => Feature> = {
    [CustomFeatureType.CRON]: (parent: Instance, options: FeatureOptions) => {return new FeatureCron(parent, options as FeatureCronOptions);},
    [CustomFeatureType.DAEMON]: (parent: Instance, options: FeatureOptions) => {return new FeatureDaemon(parent, options as FeatureDaemonOptions);}
}
export default features;