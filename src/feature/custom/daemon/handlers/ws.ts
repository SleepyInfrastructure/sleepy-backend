/* Types */ 
import FeatureDaemon from "..";
import { Client, Connection, Daemon, DaemonWebsocketAuthFailure, DaemonWebsocketMessageType, TaskType } from "../types";
import Database from "../../../../database";

/* Node Imports */
import { bold, gray, green, red, yellow } from "nanocolors"; 
import { randomBytes } from "crypto";
import { FastifyRequest } from "fastify";
import { z } from "zod";

// Local
import * as schemas from "../schemas";

export async function handleWebsocket(feature: FeatureDaemon, database: Database, connection: Connection, request: FastifyRequest) {
    console.log(`${green(">")} Socket connected!`);
    if(request.cookies.Token !== undefined) {
        const session = await database.fetch({ source: "sessions", selectors: { "id": request.cookies.Token } });
        if(session === undefined) {
            console.log(`${red("X")} Socket failed to promote to client!`);
            connection.send({ type: DaemonWebsocketMessageType.AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        const user = await database.fetch({ source: "users", selectors: { "id": session.user } });
        if(user === undefined) {
            console.log(`${red("X")} Socket failed to promote to client! (user: ${bold(yellow(session.user))})`);
            connection.send({ type: DaemonWebsocketMessageType.AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        console.log(`${yellow("^")} Socket promoted to client! (user: ${bold(yellow(user.id))})`);
        connection.client = new Client(user.id);
        connection.send({ type: DaemonWebsocketMessageType.AUTH_SUCCESS, id: user.id, username: user.username });
    }

    const validate = <T>(schema: z.Schema, data: object): (T | null) => {
        const result = schema.safeParse(data);
        if(!result.success) {
            console.log(`${red("X")} Message failed validation! (${result.error.toString()})`);
            return null;
        }
        return result.data;
    }

    connection.stream.socket.on("message", async(messageRaw) => {
        const messageRawText = messageRaw.toString();
        let messageRawJson: any;
        try {
            messageRawJson = JSON.parse(messageRawText);
        } catch(e) {
            console.log(`${red("X")} Message failed parsing! (${e})`);
            return;
        }
        const message = validate<schemas.WebsocketMessageType>(schemas.WebsocketMessage, messageRawJson);
        if(message === null) {
            return;
        }

        console.log(`${gray("-")} Got message of type ${bold(yellow(message.type))}.`);
        switch(message.type) {
            case DaemonWebsocketMessageType.DAEMON_AUTH: {
                const detailedMessage = validate<schemas.WebsocketDaemonAuthMessageType>(schemas.WebsocketDaemonAuthMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                if(connection.daemon !== null) {
                    console.log(`${red("X")} Daemon already authenticated!`);
                    return;
                }
                if(detailedMessage.version !== feature.options.version) {
                    console.log(`${red("X")} Socket failed to promote to daemon! (daemon version ${bold(red(detailedMessage.version))} is not ${bold(green(feature.options.version))})`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.VERSION_MISMATCH, version: feature.options.version });
                    return;
                }

                const daemonToken = await database.fetch({ source: "daemontokens", selectors: { id: detailedMessage.token } });
                if(daemonToken === undefined) {
                    console.log(`${red("X")} Socket failed to promote to daemon!`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
                    return;
                }
                const server = await database.fetch({ source: "servers", selectors: { id: daemonToken.server } });
                if(server === undefined) {
                    console.log(`${red("X")} Socket failed to promote to daemon! (server: ${bold(yellow(daemonToken.server))})`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
                    return;
                }
                console.log(`${yellow("^")} Socket promoted to daemon! (server: ${bold(yellow(daemonToken.server))})`);
                database.edit({ destination: "daemontokens", selectors: { id: daemonToken.id }, item: { used: Math.round(Date.now() / 1000) } });
                await database.edit({ destination: "databases", selectors: { server: daemonToken.server }, item: { credentials: 0 } });
                for(const id of detailedMessage.databases) {
                    database.edit({ destination: "databases", selectors: { id, server: daemonToken.server }, item: { credentials: 1 } });
                }

                connection.daemon = new Daemon(server.id, server.author);
                connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_SUCCESS, id: server.id, name: server.name });
                break;
            }

            case DaemonWebsocketMessageType.DAEMONS: {
                if(connection.client === null) {
                    return;
                }

                connection.send({
                    type: DaemonWebsocketMessageType.DAEMONS_REPLY,
                    items: feature.getDaemonsForAuthor(connection.client.id).map(e => {
                        if(e.daemon === null) { return null; }
                        return { id: e.daemon.id, author: e.daemon.author };
                    })
                });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_RESOURCES: {
                const detailedMessage = validate<schemas.WebsocketDaemonClientRequestResourcesMessageType>(schemas.WebsocketDaemonClientRequestResourcesMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                const requestedDaemon = feature.getDaemonForClient(connection.client, detailedMessage.id);
                if(requestedDaemon === null) {
                    break;
                }

                requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES, resources: detailedMessage.resources });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES_REPLY: {
                const detailedMessage = validate<schemas.WebsocketDaemonRequestResourcesMessageType>(schemas.WebsocketDaemonRequestResourcesMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                if(connection.daemon === null) {
                    return;
                }

                if(detailedMessage.software !== null) {
                    await database.delete({ source: "serversoftware", selectors: { server: connection.daemon.id } });
                    for(const software of detailedMessage.software) {
                        database.add({ destination: "serversoftware",
                            item: {
                                id: randomBytes(16).toString("hex"),
                                author: connection.daemon.author,
                                server: connection.daemon.id,
                                name: software.name,
                                version: software.version
                            }
                        });
                    }
                }
                if(detailedMessage.memory !== null) {
                    database.edit({ destination: "servers",
                        item: {
                            memory: detailedMessage.memory.total,
                            swap: detailedMessage.memory.swapTotal
                        },
                        selectors: { id: connection.daemon.id }
                    });
                }
                if(detailedMessage.disks !== null && detailedMessage.zfsPools !== null) {
                    await database.delete({ source: "disks", selectors: { server: connection.daemon.id } });
                    await database.delete({ source: "partitions", selectors: { server: connection.daemon.id } });
                    await database.delete({ source: "zfspools", selectors: { server: connection.daemon.id } });
                    await database.delete({ source: "zfspartitions", selectors: { server: connection.daemon.id } });
                    for(const disk of detailedMessage.disks) {
                        database.add({ destination: "disks", item:
                            {
                                id: disk.id,
                                ptuuid: disk.ptuuid,
                                author: connection.daemon.author,
                                server: connection.daemon.id,
                                name: disk.name,
                                ssd: disk.ssd === true ? 1 : 0,
                                size: disk.size,
                                model: disk.model
                            }
                        });
                        for(const partition of disk.children) {
                            database.add({ destination: "partitions", item:
                                {
                                    id: partition.id,
                                    uuid: partition.uuid,
                                    partuuid: partition.partuuid,
                                    author: connection.daemon.author,
                                    parent: disk.id,
                                    server: connection.daemon.id,
                                    name: partition.name,
                                    type: partition.type,
                                    size: partition.size,
                                    used: partition.used,
                                    mountpoint: partition.mountpoint
                                }
                            });
                        }
                    }
                    for(const pool of detailedMessage.zfsPools) {
                        database.add({ destination: "zfspools", item:
                            {
                                id: pool.id,
                                author: connection.daemon.author,
                                server: connection.daemon.id,
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
                            database.add({ destination: "zfspartitions", item:
                                {
                                    id: partition.id,
                                    author: connection.daemon.author,
                                    parent: pool.id,
                                    server: connection.daemon.id,
                                    size: partition.size,
                                    used: partition.used
                                }
                            });
                        }
                    }
                }
                if(detailedMessage.containers !== null && detailedMessage.containerProjects !== null) {
                    await database.delete({ source: "containers", selectors: { server: connection.daemon.id } });
                    await database.delete({ source: "containerprojects", selectors: { server: connection.daemon.id } });
                    for(const containerProject of detailedMessage.containerProjects) {
                        database.add({ destination: "containerprojects", item:
                            {
                                id: containerProject.id,
                                author: connection.daemon.author,
                                server: connection.daemon.id,
                                name: containerProject.name,
                                status: containerProject.status,
                                path: containerProject.path
                            }
                        });
                    }
                    for(const container of detailedMessage.containers) {
                        database.add({ destination: "containers", item:
                            {
                                id: container.id,
                                author: connection.daemon.author,
                                server: connection.daemon.id,
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

                for(const client of feature.getClientsForId(connection.daemon.author)) {
                    client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_RESOURCES_REPLY, id: connection.daemon?.id });
                }
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_DATABASE_BACKUP: {
                if(connection.client === null) {
                    return;
                }
                const detailedMessage = validate<schemas.WebsocketDaemonClientRequestDatabaseBackupMessageType>(schemas.WebsocketDaemonClientRequestDatabaseBackupMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                const requestedDaemon = feature.getDaemonForClient(connection.client, detailedMessage.id);
                if(requestedDaemon === null) {
                    break;
                }
                const serverDatabase = await database.fetch({ source: "databases", selectors: { id: detailedMessage.database, author: connection.client.id } });
                if(serverDatabase === undefined) {
                    console.log(`${red("X")} No database found to backup!`);
                    return;
                }
                const timestamp = Math.round(Date.now() / 1000);
                
                const task = {
                    id: randomBytes(16).toString("hex"),
                    author: connection.client.id,
                    type: detailedMessage.data ? TaskType.BACKUP_DATABASE : TaskType.BACKUP_DATABASE_SCHEMA,
                    object: serverDatabase.id,
                    start: timestamp,
                    status: "RUNNING",
                    progress: 0,
                    end: null,
                    result: null
                };
                database.add({ destination: "tasks", item: task });

                connection.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_TASK_REPLY, task });
                requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_DATABASE_BACKUP, database: serverDatabase.id, task: task.id, data: detailedMessage.data });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_REQUEST_STATS_REPLY: {
                if(connection.daemon === null) {
                    return;
                }
                const detailedMessage = validate<schemas.WebsocketDaemonRequestStatsReplyMessageType>(schemas.WebsocketDaemonRequestStatsReplyMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                const timestamp = Math.round(Date.now() / 1000);

                database.add({ destination: "statistics", item:
                    {
                        id: randomBytes(16).toString("hex"),
                        author: connection.daemon.author,
                        server: connection.daemon.id,
                        timestamp: timestamp,
                        cpuSystem: detailedMessage.cpu.system,
                        cpuUser: detailedMessage.cpu.user,
                        rx: detailedMessage.network.rx,
                        tx: detailedMessage.network.tx,
                        memory: detailedMessage.memory.used,
                        swap: detailedMessage.memory.swapUsed
                    }
                });
                for (const disk of detailedMessage.disks) {
                    database.add({ destination: "diskstatistics", item:
                        {
                            id: randomBytes(16).toString("hex"),
                            author: connection.daemon.author,
                            parent: disk.parent,
                            timestamp: timestamp,
                            read: disk.read,
                            write: disk.write,
                            readLatency: disk.readLatency,
                            writeLatency: disk.writeLatency
                        }
                    });
                }
                for (const container of detailedMessage.containers) {
                    database.add({ destination: "containerstatistics", item:
                        {
                            id: randomBytes(16).toString("hex"),
                            author: connection.daemon.author,
                            parent: container.parent,
                            timestamp: timestamp,
                            rx: container.rx,
                            tx: container.tx,
                            cpu: container.cpu,
                            memory: container.memory,
                            read: container.read,
                            write: container.write,
                        }
                    });
                }
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_TASK_PROGRESS: {
                if(connection.daemon === null) {
                    return;
                }
                const detailedMessage = validate<schemas.WebsocketDaemonTaskProgressMessageType>(schemas.WebsocketDaemonTaskProgressMessage, messageRawJson);
                if(detailedMessage === null) {
                    return;
                }
                const task = await database.fetch({ source: "tasks", selectors: { id: detailedMessage.task, author: connection.daemon.author } });
                if(task === undefined) {
                    console.log(`${red("X")} No task found to progress!`);
                    return;
                }
                const timestamp = Math.round(Date.now() / 1000);

                task.status = detailedMessage.status ?? task.status;
                task.progress = detailedMessage.progress ?? task.progress;
                task.end = task.status !== "RUNNING" ? timestamp : null;
                database.edit({ destination: "tasks", item: { progress: task.progress, status: task.status, end: task.end }, selectors: { id: detailedMessage.task, author: connection.daemon.author }});

                for(const client of feature.getClientsForId(connection.daemon.author)) {
                    client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_TASK_REPLY, task });
                }
                break;
            }
        }
    });
    connection.stream.socket.on("close", () => {
        feature.connections.splice(feature.connections.indexOf(connection), 1);
        if(connection.daemon !== null) {
            console.log(`${red("<")} Daemon disconnected! (server: ${bold(yellow(connection.daemon.id))})`);
            return;
        }
        if(connection.client !== null) {
            console.log(`${red("<")} Client disconnected! (user: ${bold(yellow(connection.client.id))})`);
            return;
        }
        console.log(`${red("<")} Socket disconnected!`);
    });
}