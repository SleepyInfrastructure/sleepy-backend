/* Types */
import { CronStatisticPreviousMapping, CronStatisticTimeMapping, CronStatisticType, CronUpdateStatistics } from "../types";
import { DaemonWebsocketMessageType } from "../../daemon/types";
import Database from "../../../../database";
import FeatureDaemon from "../../daemon";

/* Node Imports */
import { randomBytes } from "crypto";
import { bold, green, yellow } from "nanocolors";

export function processStatisticUpdates(feature: FeatureDaemon, database: Database, update: CronUpdateStatistics) {
    for(const resource of update.resources) {
        switch(update.statistic) {
            case CronStatisticType.MINUTE:
                for(const daemon of feature.getDaemons()) {
                    daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_STATS });
                }
                break;

            case CronStatisticType.HOUR:
            case CronStatisticType.DAY:
            case CronStatisticType.MONTH:
            case CronStatisticType.YEAR:
                switch(resource) {
                    case "GENERAL":
                        processStatisticUpdateGeneral(database, update);
                        break;

                    case "DISKS":
                        processStatisticUpdateDisks(database, update);
                        break;
                }
                break;
        }
    }
}

function reduceStatistics(statistics: any, field: string) {
    return statistics.reduce((acc: Map<string, any[]>, curr: any) => {
        if(acc.has(curr[field])) {
            acc.get(curr[field])?.push(curr);
        } else {
            acc.set(curr[field], [curr])
        }
        return acc;
    }, new Map<string, any[]>());
}

export async function processStatisticUpdateGeneral(database: Database, update: CronUpdateStatistics) {
    const statistics = await database.fetchMultiple({ source: "statistics", selectors: { type: CronStatisticPreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - CronStatisticTimeMapping[update.statistic]), comparison: ">" } } });
    const byServer = reduceStatistics(statistics, "server");
    for(const [server, serverStatistics] of byServer) {
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
}

export async function processStatisticUpdateDisks(database: Database, update: CronUpdateStatistics) {
    const statistics = await database.fetchMultiple({ source: "diskstatistics", selectors: { type: CronStatisticPreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - CronStatisticTimeMapping[update.statistic]), comparison: ">" } } });
    const byDisk = reduceStatistics(statistics, "disk");
    for(const [disk, diskStatistics] of byDisk) {
        const first = diskStatistics[0];
        const read = statistics.reduce((acc, curr) => acc + curr.read, 0) / Math.max(statistics.length, 1);
        const write = statistics.reduce((acc, curr) => acc + curr.write, 0) / Math.max(statistics.length, 1);
        const readLatency = statistics.reduce((acc, curr) => acc + curr.readLatency, 0) / Math.max(statistics.length, 1);
        const writeLatency = statistics.reduce((acc, curr) => acc + curr.writeLatency, 0) / Math.max(statistics.length, 1);
        console.log(`${green(">")} Creating a ${yellow(bold(update.statistic))} disk statistic! (disk: ${yellow(bold(disk))}, length: ${yellow(bold(diskStatistics.length))})`);
        
        database.add({ destination: "diskstatistics", item: {
            id: randomBytes(16).toString("hex"),
            parent: disk,
            author: first.author,
            type: update.statistic,
            timestamp: Math.round(Date.now() / 1000),
            read: read,
            write: write,
            readLatency: readLatency,
            writeLatency: writeLatency
        }});
    }
}