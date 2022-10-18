/* Types */
import { CronUpdate } from "feature/custom/cron/types";
import * as cg from "ts/common/const";
/* Node Imports */
import { randomBytes } from "crypto";
/* Local Imports */
import Database from "database";
import FeatureDaemon from "feature/custom/daemon";
import { green } from "nanocolors";
import { Connection } from "feature/custom/daemon/types";

export async function processAlertUpdates(feature: FeatureDaemon, database: Database, update: CronUpdate) {
    let curAlerts = 0;
    const prevAlerts = await database.delete({ source: "alerts", selectors: {} });

    const servers = await database.fetchMultiple<Server>({ source: "servers", selectors: {} });
    const daemons = feature.getDaemons();
    const serverAlerts = await Promise.all(servers.map(e => { return processServer(feature, database, e, daemons.find(el => el.daemon?.id === e.id)); }));
    curAlerts = serverAlerts.reduce((acc, curr) => acc + curr, curAlerts);

    const disks = await database.fetchMultiple<Disk>({ source: "disks", selectors: {} });
    const diskAlerts = await Promise.all(disks.map(e => { return processDisk(feature, database, e); }));
    curAlerts = diskAlerts.reduce((acc, curr) => acc + curr, curAlerts);

    const partitions = await database.fetchMultiple<Partition>({ source: "partitions", selectors: {} });
    const partitionAlerts = await Promise.all(partitions.map(e => { return processPartition(feature, database, e); }));
    curAlerts = partitionAlerts.reduce((acc, curr) => acc + curr, curAlerts);

    const containers = await database.fetchMultiple<Container>({ source: "containers", selectors: {} });
    const containerAlerts = await Promise.all(containers.map(e => { return processContainer(feature, database, e); }));
    curAlerts = containerAlerts.reduce((acc, curr) => acc + curr, curAlerts);

    const endpoints = await database.fetchMultiple<UptimeEndpoint>({ source: "uptimeendpoints", selectors: {} });
    const endpointsAlerts = await Promise.all(endpoints.map(e => { return processUptimeEndpoint(feature, database, e); }));
    curAlerts = endpointsAlerts.reduce((acc, curr) => acc + curr, curAlerts);

    console.log(`${green(">")} Refreshed alerts! (servers: ${servers.length}, alerts: ${prevAlerts} -> ${curAlerts})`);
}
export async function processServer(feature: FeatureDaemon, database: Database, server: Server, connection?: Connection): Promise<number> {
    let alerts = 0;
    if(connection === undefined) {
        const alert: Alert = {
            id: randomBytes(16).toString("hex"),
            author: server.author,
            type: "SERVER_DOWN",
            object: server.id
        }
        database.add({ destination: "alerts", item: alert });
        alerts++;
    }
    const statistic = await database.fetch<Statistic>({ source: "statistics", selectors: { server: server.id, type: "MINUTE" }, sort: { field: "timestamp", order: "DESC" } });
    if(statistic !== null) {
        if(statistic.cpuSystem + statistic.cpuUser > 75) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: server.author,
                type: "SERVER_CPU_LOAD",
                object: server.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
        if(statistic.memory > 80) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: server.author,
                type: "SERVER_MEM_LOAD",
                object: server.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
        if(statistic.rx + statistic.tx > cg.NET_HIGH_LOAD) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: server.author,
                type: "SERVER_NET_LOAD",
                object: server.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
    }

    return alerts;
}
export async function processDisk(feature: FeatureDaemon, database: Database, disk: Disk): Promise<number> {
    let alerts = 0;
    const statistic = await database.fetch<DiskStatistic>({ source: "diskstatistics", selectors: { parent: disk.id, type: "MINUTE" }, sort: { field: "timestamp", order: "DESC" } });
    if(statistic !== null) {
        if(statistic.read + statistic.write > cg.DISK_HIGH_LOAD) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: disk.author,
                type: "DISK_LOAD",
                object: disk.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
        if(statistic.readLatency + statistic.writeLatency > cg.DISK_HIGH_LATENCY) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: disk.author,
                type: "DISK_LATENCY",
                object: disk.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
    }

    return alerts;
}
export async function processPartition(feature: FeatureDaemon, database: Database, partition: Partition): Promise<number> {
    let alerts = 0;
    if(partition.size * 0.8 < (partition.used ?? 0)) {
        const alert: Alert = {
            id: randomBytes(16).toString("hex"),
            author: partition.author,
            type: "PARTITION_LOW_SPACE",
            object: partition.id
        }
        database.add({ destination: "alerts", item: alert });
        alerts++;
    }

    return alerts;
}
export async function processContainer(feature: FeatureDaemon, database: Database, container: Container): Promise<number> {
    let alerts = 0;
    if(container.status !== "running") {
        const alert: Alert = {
            id: randomBytes(16).toString("hex"),
            author: container.author,
            type: "CONTAINER_DOWN",
            object: container.id
        }
        database.add({ destination: "alerts", item: alert });
        alerts++;
    }

    return alerts;
}
export async function processUptimeEndpoint(feature: FeatureDaemon, database: Database, endpoint: UptimeEndpoint): Promise<number> {
    let alerts = 0;
    const statistic = await database.fetch<UptimeEndpointStatistic>({ source: "uptimestatistics", selectors: { parent: endpoint.id }, sort: { field: "timestamp", order: "DESC" } });
    if(statistic !== null) {
        if((endpoint.host !== null && statistic.pingTime === null) || (endpoint.requestEndpoint !== null && statistic.requestTime === null)) {
            const alert: Alert = {
                id: randomBytes(16).toString("hex"),
                author: endpoint.author,
                type: "UPTIME_ENDPOINT_DOWN",
                object: endpoint.id
            }
            database.add({ destination: "alerts", item: alert });
            alerts++;
        }
    }

    return alerts;
}