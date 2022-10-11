/* Types */
import { Connection, Daemon, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { randomBytes } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";
import { stringToArray } from "util/general";

class DaemonRequestResourcesReplyMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonRequestResourcesReplyMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES_REPLY], schemas.WebsocketDaemonRequestResourcesReplyMessage);
    }

    async handleDaemon(connection: Connection, message: schemas.WebsocketDaemonRequestResourcesReplyMessageType, daemon: Daemon): Promise<void> {
        if(message.software !== null) {
            await this.parent.database.delete({ source: "serversoftware", selectors: { server: daemon.id } });
            for(const software of message.software) {
                const serverSoftware: ServerSoftware = {
                    id: randomBytes(16).toString("hex"),
                    author: daemon.author,
                    server: daemon.id,
                    name: software.name,
                    version: software.version
                }
                this.parent.database.add({ destination: "serversoftware", item: serverSoftware });
            }
        }
        if(message.memory !== null) {
            this.parent.database.edit({ destination: "servers",
                item: {
                    memory: message.memory.total,
                    swap: message.memory.swapTotal
                },
                selectors: { id: daemon.id }
            });
        }
        if(message.disks !== null && message.zfsPools !== null) {
            // TODO: clear disk statistics
            await this.parent.database.delete({ source: "disks", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "partitions", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "zfspools", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "zfspartitions", selectors: { server: daemon.id } });
            for(const disk of message.disks) {
                const serverDisk: Disk = {
                    id: disk.id,
                    ptuuid: disk.ptuuid,
                    author: daemon.author,
                    server: daemon.id,
                    name: disk.name,
                    ssd: disk.ssd,
                    size: disk.size,
                    model: disk.model
                };
                this.parent.database.add({ destination: "disks", item: serverDisk });
                for(const partition of disk.children) {
                    const serverPartition: Partition = {
                        id: partition.id,
                        uuid: partition.uuid,
                        partuuid: partition.partuuid,
                        author: daemon.author,
                        parent: disk.id,
                        server: daemon.id,
                        name: partition.name,
                        type: partition.type,
                        size: partition.size,
                        used: partition.used,
                        mountpoint: partition.mountpoint
                    };
                    this.parent.database.add({ destination: "partitions", item: serverPartition });
                }
            }
            for(const pool of message.zfsPools) {
                const serverPool: ZFSPool = {
                    id: pool.id,
                    author: daemon.author,
                    server: daemon.id,
                    name: pool.name,
                    size: pool.size,
                    used: pool.used,
                    compression: pool.compression,
                    compressRatio: pool.compressRatio,
                    encryption: pool.encryption,
                    atime: pool.atime,
                    version: pool.version,
                    deduplication: pool.deduplication,
                    relatime: pool.relatime
                };
                this.parent.database.add({ destination: "zfspools", item: serverPool });
                for(const partition of pool.children) {
                    const serverPartition: ZFSPartition = {
                        id: partition.id,
                        author: daemon.author,
                        parent: pool.id,
                        server: daemon.id,
                        size: partition.size,
                        used: partition.used
                    };
                    this.parent.database.add({ destination: "zfspartitions", item: serverPartition });
                }
            }
        }
        if(message.containers !== null && message.containerProjects !== null) {
            // TODO: clear container statistics
            await this.parent.database.delete({ source: "containers", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "containerprojects", selectors: { server: daemon.id } });
            for(const containerProject of message.containerProjects) {
                const serverProject: ContainerProject = {
                    id: containerProject.id,
                    author: daemon.author,
                    server: daemon.id,
                    name: containerProject.name,
                    status: containerProject.status,
                    path: containerProject.path
                };
                this.parent.database.add({ destination: "containerprojects", item: serverProject });
            }
            for(const container of message.containers) {
                const serverContainer: Container = {
                    id: container.id,
                    rawId: container.rawId,
                    author: daemon.author,
                    server: daemon.id,
                    parent: container.parent,
                    image: container.image,
                    creation: container.creation,
                    ports: stringToArray(container.ports),
                    status: container.status,
                    name: container.name,
                    mounts: stringToArray(container.mounts),
                    networks: stringToArray(container.networks)
                };
                this.parent.database.add({ destination: "containers", item: serverContainer });
            }
        }

        for(const client of this.parent.getClientsForId(daemon.author)) {
            client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_RESOURCES_REPLY, id: daemon?.id });
        }
    }
}

export default DaemonRequestResourcesReplyMessageHandler;