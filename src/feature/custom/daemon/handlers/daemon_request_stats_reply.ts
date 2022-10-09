/* Types */
import { Connection, Daemon, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { randomBytes } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonRequestStatsReplyMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonRequestStatsReplyMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_REQUEST_STATS_REPLY], schemas.WebsocketDaemonRequestStatsReplyMessage);
    }

    handleDaemon(connection: Connection, message: schemas.WebsocketDaemonRequestStatsReplyMessageType, daemon: Daemon): void {
        const timestamp = Math.round(Date.now() / 1000);
        const statistic: Statistic = {
            id: randomBytes(16).toString("hex"),
            author: daemon.author,
            server: daemon.id,
            type: StatisticType.MINUTE,
            timestamp: timestamp,
            cpuSystem: message.cpu.system,
            cpuUser: message.cpu.user,
            rx: message.network.rx,
            tx: message.network.tx,
            memory: message.memory.used,
            swap: message.memory.swapUsed
        };
        this.parent.database.add({ destination: "statistics", item: statistic });
        for (const disk of message.disks) {
            const diskStatistic: DiskStatistic = {
                id: randomBytes(16).toString("hex"),
                author: daemon.author,
                parent: disk.parent,
                type: StatisticType.MINUTE,
                timestamp: timestamp,
                read: disk.read,
                write: disk.write,
                readLatency: disk.readLatency,
                writeLatency: disk.writeLatency
            }
            this.parent.database.add({ destination: "diskstatistics", item: diskStatistic });
        }
        for (const container of message.containers) {
            const containerStatistic: ContainerStatistic = {
                id: randomBytes(16).toString("hex"),
                author: daemon.author,
                parent: container.parent,
                timestamp: timestamp,
                rx: container.rx,
                tx: container.tx,
                cpu: container.cpu,
                memory: container.memory,
                read: container.read,
                write: container.write,
            };
            this.parent.database.add({ destination: "containerstatistics", item: containerStatistic });
        }
    }
}

export default DaemonRequestStatsReplyMessageHandler;