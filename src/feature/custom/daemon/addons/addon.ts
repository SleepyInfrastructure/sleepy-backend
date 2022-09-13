import FeatureDaemon from "..";
import { Connection } from "../types";

export enum FeatureDaemonAddonType {
    DAEMON_LOG_MANAGER = "DAEMON_LOG_MANAGER"
}

class FeatureDaemonAddon {
    name: FeatureDaemonAddonType;
    parent: FeatureDaemon;

    constructor(name: FeatureDaemonAddonType, feature: FeatureDaemon) {
        this.name = name;
        this.parent = feature;
    }

    connect?(connection: Connection): void;
    disconnect?(connection: Connection): void;
}
export default FeatureDaemonAddon;