/* Types */
import { StatisticTimeMapping, StatisticTypePreviousMapping } from "ts/common/const";
import { CronUpdateResourcesType, CronUpdateStatistics } from "feature/custom/cron/types";
import { DaemonWebsocketMessageType } from "feature/custom/daemon/types";
/* Node Imports */
import { randomBytes } from "crypto";
import { bold, green, yellow } from "nanocolors";
/* Local Imports */
import Database from "database";
import FeatureDaemon from "feature/custom/daemon";

export function processStatisticUpdates(feature: FeatureDaemon, database: Database, update: CronUpdateStatistics) {
    for(const resource of update.resources) {
        switch(update.statistic) {
            case "MINUTE":
                for(const daemon of feature.getDaemons()) {
                    daemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_STATS });
                }
                break;

            case "HOUR":
            case "DAY":
            case "MONTH":
            case "YEAR":
                switch(resource) {
                    case CronUpdateResourcesType.GENERAL:
                        processStatisticUpdateGeneral(database, update);
                        break;

                    case CronUpdateResourcesType.DISKS:
                        processStatisticUpdateDisks(database, update);
                        break;

                    case CronUpdateResourcesType.CONTAINERS:
                        processStatisticUpdateContainers(database, update);
                        break;
                }
                break;
        }
    }
}

function reduceStatistics<T extends Record<string, any>>(statistics: T[], field: string) {
    return statistics.reduce((acc: Map<string, T[]>, curr: T) => {
        if(acc.has(curr[field])) {
            acc.get(curr[field])?.push(curr);
        } else {
            acc.set(curr[field], [curr])
        }
        return acc;
    }, new Map<string, T[]>());
}

export async function processStatisticUpdateGeneral(database: Database, update: CronUpdateStatistics) {
    const statistics = await database.fetchMultiple<Statistic>({ source: "statistics", selectors: { type: StatisticTypePreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - StatisticTimeMapping[update.statistic]), comparison: ">" } } });
    const byServer = reduceStatistics<Statistic>(statistics, "server");
    for(const [server, serverStatistics] of byServer) {
        const first = serverStatistics[0];
        const cpuSystem = statistics.reduce((acc, curr) => acc + curr.cpuSystem, 0) / Math.max(statistics.length, 1);
        const cpuUser = statistics.reduce((acc, curr) => acc + curr.cpuUser, 0) / Math.max(statistics.length, 1);
        const memory = statistics.reduce((acc, curr) => acc + curr.memory, 0) / Math.max(statistics.length, 1);
        const swap = statistics.reduce((acc, curr) => acc + curr.swap, 0) / Math.max(statistics.length, 1);
        const rx = statistics.reduce((acc, curr) => acc + curr.rx, 0);
        const tx = statistics.reduce((acc, curr) => acc + curr.tx, 0);
        console.log(`${green(">")} Creating a ${yellow(bold(update.statistic))} statistic! (server: ${yellow(bold(server))}, length: ${yellow(bold(serverStatistics.length))})`);
        
        const statistic: Statistic = {
            id: randomBytes(16).toString("hex"),
            author: first.author,
            server: server,
            timestamp: Math.round(Date.now() / 1000),
            type: update.statistic,
            cpuSystem: cpuSystem,
            cpuUser: cpuUser,
            memory: memory,
            swap: swap,
            rx: rx,
            tx: tx
        };
        database.add({ destination: "statistics", item: statistic });
    }
}

export async function processStatisticUpdateDisks(database: Database, update: CronUpdateStatistics) {
    const statistics = await database.fetchMultiple<DiskStatistic>({ source: "diskstatistics", selectors: { type: StatisticTypePreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - StatisticTimeMapping[update.statistic]), comparison: ">" } } });
    const byDisk = reduceStatistics<DiskStatistic>(statistics, "parent");
    for(const [disk, diskStatistics] of byDisk) {
        const first = diskStatistics[0];
        const read = statistics.reduce((acc, curr) => acc + curr.read, 0) / Math.max(statistics.length, 1);
        const write = statistics.reduce((acc, curr) => acc + curr.write, 0) / Math.max(statistics.length, 1);
        const readLatency = statistics.reduce((acc, curr) => acc + curr.readLatency, 0) / Math.max(statistics.length, 1);
        const writeLatency = statistics.reduce((acc, curr) => acc + curr.writeLatency, 0) / Math.max(statistics.length, 1);
        console.log(`${green(">")} Creating a ${yellow(bold(update.statistic))} disk statistic! (disk: ${yellow(bold(disk))}, length: ${yellow(bold(diskStatistics.length))})`);
        
        const statistic: DiskStatistic = {
            id: randomBytes(16).toString("hex"),
            parent: disk,
            author: first.author,
            timestamp: Math.round(Date.now() / 1000),
            type: update.statistic,
            read: read,
            write: write,
            readLatency: readLatency,
            writeLatency: writeLatency
        };
        database.add({ destination: "diskstatistics", item: statistic });
    }
}

export async function processStatisticUpdateContainers(database: Database, update: CronUpdateStatistics) {
    const statistics = await database.fetchMultiple<ContainerStatistic>({ source: "containerstatistics", selectors: { type: StatisticTypePreviousMapping[update.statistic], timestamp: { value: (Math.round(Date.now() / 1000) - StatisticTimeMapping[update.statistic]), comparison: ">" } } });
    const byContainer = reduceStatistics<ContainerStatistic>(statistics, "parent");
    for(const [container, containerStatistics] of byContainer) {
        const first = containerStatistics[0];
        const cpu = statistics.reduce((acc, curr) => acc + curr.cpu, 0) / Math.max(statistics.length, 1);
        const memory = statistics.reduce((acc, curr) => acc + curr.memory, 0) / Math.max(statistics.length, 1);
        const rx = statistics.reduce((acc, curr) => acc + curr.rx, 0);
        const tx = statistics.reduce((acc, curr) => acc + curr.tx, 0);
        const read = statistics.reduce((acc, curr) => acc + curr.read, 0) / Math.max(statistics.length, 1);
        const write = statistics.reduce((acc, curr) => acc + curr.write, 0) / Math.max(statistics.length, 1);
        console.log(`${green(">")} Creating a ${yellow(bold(update.statistic))} container statistic! (container: ${yellow(bold(container))}, length: ${yellow(bold(containerStatistics.length))})`);
        
        const statistic: ContainerStatistic = {
            id: randomBytes(16).toString("hex"),
            parent: container,
            author: first.author,
            timestamp: Math.round(Date.now() / 1000),
            type: update.statistic,
            cpu: cpu,
            memory: memory,
            rx: rx,
            tx: tx,
            read: read,
            write: write
        };
        database.add({ destination: "containerstatistics", item: statistic });
    }
}