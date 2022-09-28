/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { Status } from "../../../ts/base";
import { DatabaseType } from "../../../database/types";
import { CronClean, CronCleanType, CronInterval, CronStatisticNextMapping, CronStatisticPreviousMapping, CronStatisticTimeMapping, CronStatisticType, CronUpdate, CronUpdateResources, CronUpdateResourcesType, CronUpdateType, FeatureCronOptions } from "./types";
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
        if(interval.updates !== undefined) {
            for(const update of interval.updates) {
                console.log(`${gray("-")} Launching ${bold(yellow(update.type))} cron-job...`);
                this.processUpdate(featureDaemon, database, update);
            }
        }
        if(interval.cleans !== undefined) {
            for(const clean of interval.cleans) {
                this.processClean(database, clean);
            }
        }
    }

    async processUpdate(featureDaemon: FeatureDaemon, database: Database, update: CronUpdate) {
        switch(update.type) {
            case CronUpdateType.RESOURCES:
                const resourcesUpdate = update as CronUpdateResources;
                for(const daemon of featureDaemon.getDaemons()) {
                    daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES, resources: resourcesUpdate.resources });
                }
                break;
                
            case CronUpdateType.STATISTICS:
                switch(update.statistic) {
                    case CronStatisticType.MINUTE:
                        for(const daemon of featureDaemon.getDaemons()) {
                            daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_STATS });
                        }
                        break;

                    case CronStatisticType.HOUR:
                    case CronStatisticType.DAY:
                    case CronStatisticType.MONTH:
                    case CronStatisticType.YEAR:
                        const statistics = await database.fetchMultiple({ source: "statistics", selectors: { type: CronStatisticPreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - CronStatisticTimeMapping[update.statistic]), comparison: ">" } } });
                        const byUser = statistics.reduce((acc: Map<string, any[]>, curr) => {
                            if(acc.has(curr.server)) {
                                acc.get(curr.server)?.push(curr);
                            } else {
                                acc.set(curr.server, [curr])
                            }
                            return acc;
                        }, new Map<string, any[]>());
                        for(const [server, serverStatistics] of byUser) {
                            const first = serverStatistics[0];
                            const cpuSystem = statistics.reduce((acc, curr) => acc + curr.cpuSystem, 0) / Math.max(statistics.length, 1);
                            const cpuUser = statistics.reduce((acc, curr) => acc + curr.cpuUser, 0) / Math.max(statistics.length, 1);
                            const rx = statistics.reduce((acc, curr) => acc + curr.rx, 0) / Math.max(statistics.length, 1);
                            const tx = statistics.reduce((acc, curr) => acc + curr.tx, 0) / Math.max(statistics.length, 1);
                            const memory = statistics.reduce((acc, curr) => acc + curr.memory, 0) / Math.max(statistics.length, 1);
                            const swap = statistics.reduce((acc, curr) => acc + curr.swap, 0) / Math.max(statistics.length, 1);
                            console.log(`${green(">")} Creating a ${yellow(bold(update.statistic))} statistic! (server: ${yellow(bold(server))}, length: ${yellow(bold(serverStatistics.length))})`);
                            
                            database.add({ destination: "statistics", item: {
                                id: randomBytes(16).toString("hex"),
                                author: first.author,
                                server: server,
                                type: update.statistic,
                                timestamp: Math.round(Date.now() / 1000),
                                cpuSystem: cpuSystem,
                                cpuUser: cpuUser,
                                rx: rx,
                                tx: tx,
                                memory: memory,
                                swap: swap
                            }});
                        }
                        break;
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
            case CronCleanType.STATISTICS: {
                const time = CronStatisticTimeMapping[CronStatisticNextMapping[clean.statistic]]
                const deletedStats = await database.delete({ source: "statistics", selectors: { type: clean.statistic, timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                const deletedDiskStats = await database.delete({ source: "diskstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                const deletedContainerStats = await database.delete({ source: "containerstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                console.log(`${gray("-")} Deleted ${bold(yellow((deletedStats + deletedDiskStats + deletedContainerStats)))} old statistics...`);
                break;
            }

            case CronCleanType.UPTIME_STATISTICS: {
                const deletedStats = await database.delete({ source: "uptimestatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                console.log(`${gray("-")} Deleted ${bold(yellow(deletedStats))} old uptime statistics...`);
                break;
            }

            case CronCleanType.TASKS: {
                const deletedTasks = await database.delete({ source: "tasks", selectors: { end: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
                console.log(`${gray("-")} Deleted ${bold(yellow(deletedTasks))} old tasks...`);
                break;
            }
        }
    }
}

export default FeatureCron;
