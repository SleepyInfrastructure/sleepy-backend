/* Types */
import { Connection, Daemon, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { randomBytes } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonRequestResourcesReplyMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonRequestResourcesReplyMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES_REPLY], schemas.WebsocketDaemonRequestResourcesReplyMessage);
    }

    async handleDaemon(connection: Connection, message: schemas.WebsocketDaemonRequestResourcesReplyMessageType, daemon: Daemon): Promise<void> {
        if(message.software !== null) {
            await this.parent.database.delete({ source: "serversoftware", selectors: { server: daemon.id } });
            for(const software of message.software) {
                this.parent.database.add({ destination: "serversoftware",
                    item: {
                        id: randomBytes(16).toString("hex"),
                        author: daemon.author,
                        server: daemon.id,
                        name: software.name,
                        version: software.version
                    }
                });
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
            await this.parent.database.delete({ source: "disks", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "partitions", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "zfspools", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "zfspartitions", selectors: { server: daemon.id } });
            for(const disk of message.disks) {
                this.parent.database.add({ destination: "disks", item:
                    {
                        id: disk.id,
                        ptuuid: disk.ptuuid,
                        author: daemon.author,
                        server: daemon.id,
                        name: disk.name,
                        ssd: disk.ssd === true ? 1 : 0,
                        size: disk.size,
                        model: disk.model
                    }
                });
                for(const partition of disk.children) {
                    this.parent.database.add({ destination: "partitions", item:
                        {
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
                        }
                    });
                }
            }
            for(const pool of message.zfsPools) {
                this.parent.database.add({ destination: "zfspools", item:
                    {
                        id: pool.id,
                        author: daemon.author,
                        server: daemon.id,
                        name: pool.name,
                        size: pool.size,
                        used: pool.used,
                        compression: pool.compression,
                        compressRatio: pool.compressRatio,
                        encryption: pool.encryption === true ? 1 : 0,
                        atime: pool.atime === true ? 1 : 0,
                        version: pool.version,
                        deduplication: pool.deduplication === true ? 1 : 0,
                        relatime: pool.relatime === true ? 1 : 0
                    }
                });
                for(const partition of pool.children) {
                    this.parent.database.add({ destination: "zfspartitions", item:
                        {
                            id: partition.id,
                            author: daemon.author,
                            parent: pool.id,
                            server: daemon.id,
                            size: partition.size,
                            used: partition.used
                        }
                    });
                }
            }
        }
        if(message.containers !== null && message.containerProjects !== null) {
            await this.parent.database.delete({ source: "containers", selectors: { server: daemon.id } });
            await this.parent.database.delete({ source: "containerprojects", selectors: { server: daemon.id } });
            for(const containerProject of message.containerProjects) {
                this.parent.database.add({ destination: "containerprojects", item:
                    {
                        id: containerProject.id,
                        author: daemon.author,
                        server: daemon.id,
                        name: containerProject.name,
                        status: containerProject.status,
                        path: containerProject.path
                    }
                });
            }
            for(const container of message.containers) {
                this.parent.database.add({ destination: "containers", item:
                    {
                        id: container.id,
                        author: daemon.author,
                        server: daemon.id,
                        parent: container.parent,
                        image: container.image,
                        creation: container.creation,
                        ports: container.ports,
                        status: container.status,
                        names: container.names,
                        mounts: container.mounts,
                        networks: container.networks
                    }
                });
            }
        }

        for(const client of this.parent.getClientsForId(daemon.author)) {
            client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_RESOURCES_REPLY, id: daemon?.id });
        }
    }
}

export default DaemonRequestResourcesReplyMessageHandler;