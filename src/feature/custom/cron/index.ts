/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { Status } from "../../../ts/base";
import { DatabaseType } from "../../../database/types";
import { CronClean, CronInterval, CronUpdateType, FeatureCronOptions } from "./types";
import { DaemonWebsocketMessageType } from "../daemon/types";
import FeatureDaemon from "../daemon";

/* Node Imports */
import * as cron from "node-cron";
import { bold, gray, green, yellow } from "nanocolors";
import Database from "../../../database";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { randomBytes } from "crypto";
import ping from "pingman";
import { lookup } from "dns";

class FeatureCron extends Feature {
    options: FeatureCronOptions;

    constructor(parent: Instance, options: FeatureCronOptions) {
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

    processInterval(featureDaemon: FeatureDaemon, database: Database, interval: CronInterval) {
        for(const update of interval.updates) {
            console.log(`${gray("-")} Launching ${bold(yellow(update))} cron-job...`);
            this.processUpdate(featureDaemon, database, update);
        }
        for(const clean of interval.cleans) {
            this.processClean(database, clean);
        }
    }

    async processUpdate(featureDaemon: FeatureDaemon, database: Database, update: CronUpdateType) {
        switch(update) {
            case CronUpdateType.RESOURCES:
                for(const daemon of featureDaemon.daemons) {
                    daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES });
                }
                break;
                
            case CronUpdateType.STATISTICS:
                for(const daemon of featureDaemon.daemons) {
                    daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_STATS });
                }
                break;

            case CronUpdateType.UPTIME_ENDPOINTS:
                const endpoints = await database.fetchMultiple({ source: "uptimeendpoints", selectors: {} });
                for(const endpoint of endpoints) {
                    this.processEndpointUptime(database, endpoint);
                }
                break;
        }
    }

    async processEndpointUptime(database: Database, endpoint: any) {
        let pingTime: number | null = null;
        if(endpoint.host !== null) {
            pingTime = await new Promise((resolve) => {
                lookup(endpoint.host, async(e, address) => {
                    if(e !== null) {
                        console.error(e);
                        resolve(-1);
                        return;
                    }
                    try {
                        const res = await ping(address, { numberOfEchos: 1 });
                        resolve(res.alive === true && res.avg !== undefined ? res.avg : -1);
                    } catch(e) {
                        console.error(e);
                        resolve(-1);
                    }
                });
            });
        }

        let requestTime: number | null = null;
        if(endpoint.requestEndpoint !== null) {
            requestTime = await new Promise((resolve) => {
                const requestStart = Date.now();
                if(endpoint.requestEndpoint.startsWith("https://")) {
                    const req = httpsRequest(endpoint.requestEndpoint, () => {
                        resolve(Date.now() - requestStart);
                        req.destroy();
                    });
                    req.on("error", () =>{
                        resolve(-1);
                        req.destroy();
                    });
                    req.write("");
                    req.end();
                } else if(endpoint.requestEndpoint.startsWith("http://")) {
                    const req = httpRequest(endpoint.requestEndpoint, () => {
                        resolve(Date.now() - requestStart);
                        req.destroy();
                    });
                    req.on("error", () => {
                        resolve(-1);
                        req.destroy();
                    });
                    req.write("");
                    req.end();
                } else {
                    resolve(-1);
                }
            });
        }

        this.processEndpointUptimeResult(database, endpoint, pingTime, requestTime);
    }

    processEndpointUptimeResult(database: Database, endpoint: any, pingTime: number | null, requestTime: number | null) {
        database.add({
            destination: "uptimestatistics",
            item: {
                id: randomBytes(16).toString("hex"),
                author: endpoint.author,
                parent: endpoint.id,
                timestamp: Math.round(Date.now() / 1000),
                pingTime: pingTime,
                requestTime: requestTime
            }
        });
    }

    async processClean(database: Database, clean: CronClean) {
        switch(clean.type) {
            case "STATISTICS": {
                const deletedStats = await database.delete({ source: "statistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                const deletedDiskStats = await database.delete({ source: "diskstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                const deletedContainerStats = await database.delete({ source: "containerstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                console.log(`${gray("-")} Deleted ${bold(yellow((deletedStats + deletedDiskStats + deletedContainerStats)))} old statistics...`);
                break;
            }

            case "UPTIME_STATISTICS": {
                const deletedStats = await database.delete({ source: "uptimestatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                console.log(`${gray("-")} Deleted ${bold(yellow(deletedStats))} old uptime statistics...`);
                break;
            }
        }
    }
}

export default FeatureCron;
