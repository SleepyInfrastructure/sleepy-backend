/* Types */
import { CronUpdate, CronUpdateResources, CronUpdateStatistics, CronUpdateType } from "../types";
import { DaemonWebsocketMessageType } from "../../daemon/types";
import FeatureDaemon from "../../daemon";
import Database from "../../../../database";

/* Node Imports */
import { processEndpointUptime } from "./endpoints";
import { processStatisticUpdates } from "./statistics";

export default async function processUpdate(feature: FeatureDaemon, database: Database, update: CronUpdate) {
    switch(update.type) {
        case CronUpdateType.RESOURCES:
            const resourcesUpdate = update as CronUpdateResources;
            for(const daemon of feature.getDaemons()) {
                daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES, resources: resourcesUpdate.resources });
            }
            break;
            
        case CronUpdateType.STATISTICS:
            const statisticsUpdate = update as CronUpdateStatistics;
            processStatisticUpdates(feature, database, statisticsUpdate);
            break;

        case CronUpdateType.UPTIME_ENDPOINTS:
            const endpoints = await database.fetchMultiple({ source: "uptimeendpoints", selectors: {} });
            for(const endpoint of endpoints) {
                processEndpointUptime(database, endpoint);
            }
            break;
    }
}
