/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { DatabaseType, Status } from "../../../ts/base";
import { DaemonCronInterval, DaemonCronUpdateType, FeatureDaemonCronOptions } from "./types";
import { DaemonWebsocketMessageType } from "../daemon/types";
import FeatureDaemon from "../daemon";

/* Node Imports */
import * as cron from "node-cron";
import { bold, gray, green, inverse, yellow } from "nanocolors";
import Database from "../../../database";

class FeatureDaemonCron extends Feature {
    options: FeatureDaemonCronOptions;

    constructor(parent: Instance, options: FeatureDaemonCronOptions) {
        super(parent, options);
        this.options = options;
    }

    async start(): Promise<void> {
        const database = this.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        const featureDaemon = this.parent.featureContainer.get("daemon") as FeatureDaemon;
        if (featureDaemon === undefined) {
            this.state = { status: Status.ERROR, message: "NO_FEATURE_DAEMON_FOUND" };
            return;
        }

        for(const interval of this.options.intervals) {
            cron.schedule(interval.time, () => {
                this.processInterval(featureDaemon, database, interval);
            });
        }
        console.log(`${green(">")} Registered ${yellow(bold(this.options.intervals.length))} cron-jobs!`);
    }

    async processInterval(featureDaemon: FeatureDaemon, database: Database, interval: DaemonCronInterval) {
        for(const update of interval.updates) {
            if(update !== "REALTIME_STATS") {
                console.log(`${gray("-")} Launching ${bold(yellow(update))} cron-job for ${yellow(bold(featureDaemon.daemons.length))} daemons...`);
            }
            switch(update) {
                case DaemonCronUpdateType.REFRESH:
                    for(const daemon of featureDaemon.daemons) {
                        daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_REFRESH });
                    }
                    break;
                    
                case DaemonCronUpdateType.STATS:
                    for(const daemon of featureDaemon.daemons) {
                        daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_STATS });
                    }
                    break;
                    
                case DaemonCronUpdateType.REALTIME_STATS:
                    for(const client of featureDaemon.clients) {
                        const daemon = featureDaemon.daemons.find(e => e.author === client.id);
                        if(daemon !== undefined) {
                            daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_LIVE_STATS });
                        }
                    }
                    break;
            }
        }
        for(const clean of interval.cleans) {
            switch(clean.type) {
                case "STATS":
                    const deletedStats = await database.delete({ source: "statistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                    const deletedDiskStats = await database.delete({ source: "diskstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                    console.log(`${gray("-")} Deleted ${bold(yellow((deletedStats + deletedDiskStats)))} old statistics...`);
                    break;
            }
        }
    }
}

export default FeatureDaemonCron;
