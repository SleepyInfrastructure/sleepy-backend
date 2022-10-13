/* Types */
import { CronUpdate, CronUpdateResources, CronUpdateStatistics, CronUpdateType } from "feature/custom/cron/types";
import { DaemonWebsocketMessageType } from "feature/custom/daemon/types";
/* Node Imports */
import { processEndpointUptime } from "./endpoints";
import { processStatisticUpdates } from "./statistics";
/* Local Imports */
import Database from "database";
import FeatureDaemon from "feature/custom/daemon";

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
            const endpoints = await database.fetchMultiple<UptimeEndpoint>({ source: "uptimeendpoints", selectors: {} });
            for(const endpoint of endpoints) {
                processEndpointUptime(database, endpoint);
            }
            break;
    }
}
