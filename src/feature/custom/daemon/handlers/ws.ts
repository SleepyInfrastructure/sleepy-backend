/* Types */ 
import FeatureDaemon from "..";
import { Client, Connection, Daemon, DaemonWebsocketAuthFailure, DaemonWebsocketMessageType } from "../types";
import Database from "../../../../database";

/* Node Imports */
import { bold, gray, green, red, yellow } from "nanocolors"; 
import { randomBytes } from "crypto";
import { FastifyRequest } from "fastify";

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
        connection.client = new Client(connection, user.id);
        feature.clients.push(connection.client);
        connection.send({ type: DaemonWebsocketMessageType.AUTH_SUCCESS, id: user.id, username: user.username });
    }

    connection.stream.socket.on("message", async(messageRaw) => {
        let message: any;
        try {
            message = JSON.parse(messageRaw.toString());
        } catch(e) {
            console.log(messageRaw.toString());
            return;
        }

        console.log(`${gray("-")} Got message of type ${bold(yellow(message.type))}.`);
        switch(message.type) {
            case DaemonWebsocketMessageType.DAEMON_AUTH: {
                if(message.token == null || message.version == null) { return; }
                if(connection.daemon !== null) {
                    console.log(`${red("X")} Daemon already authenticated!`);
                    return;
                }
                if(message.version !== feature.options.version) {
                    console.log(`${red("X")} Socket failed to promote to daemon! (daemon version ${bold(red(message.version))} is not ${bold(green(feature.options.version))})`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.VERSION_MISMATCH, version: feature.options.version });
                    return;
                }

                const daemonToken = await database.fetch({ source: "daemontokens", selectors: { "id": message.token } });
                if(daemonToken === undefined) {
                    console.log(`${red("X")} Socket failed to promote to daemon!`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
                    return;
                }
                const server = await database.fetch({ source: "servers", selectors: { "id": daemonToken.server } });
                if(server === undefined) {
                    console.log(`${red("X")} Socket failed to promote to daemon! (server: ${bold(yellow(daemonToken.server))})`);
                    connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
                    return;
                }
                console.log(`${yellow("^")} Socket promoted to daemon! (server: ${bold(yellow(daemonToken.server))})`);
                connection.daemon = new Daemon(connection, server.id, server.author);
                feature.daemons.push(connection.daemon);
                connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_SUCCESS, id: server.id, name: server.name });

                const options = { destination: "daemontokens", selectors: { "id": daemonToken.id }, item: { used: Math.round(Date.now() / 1000) } };
                database.edit(options);
                break;
            }

            case DaemonWebsocketMessageType.DAEMONS: {
                if(connection.client === null) {
                    return;
                }

                connection.send({
                    type: DaemonWebsocketMessageType.DAEMONS_REPLY,
                    items: feature.getDaemons(connection.client.id).map(e => { return { "author": e.author, "server": e.id } })
                });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_REFRESH: {
                const requestedDaemon = feature.getDaemon(connection.client, message.id);
                if(requestedDaemon === null) {
                    break;
                }

                requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_REFRESH });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_REQUEST_REFRESH_REPLY: {
                if(message.disks == null || message.containers == null || message.containerProjects == null) { return; }
                if(connection.daemon === null) {
                    return;
                }

                await database.delete({ source: "disks", selectors: { server: connection.daemon.id } });
                await database.delete({ source: "partitions", selectors: { server: connection.daemon.id } });
                await database.delete({ source: "containers", selectors: { server: connection.daemon.id } });
                await database.delete({ source: "containerprojects", selectors: { server: connection.daemon.id } });
                for(const disk of message.disks) {
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
                for(const containerProject of message.containerProjects) {
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
                for(const container of message.containers) {
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

                for(const daemonClient of feature.getClients(connection.daemon.author)) {
                    daemonClient.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_REFRESH_REPLY, id: connection.daemon?.id });
                }
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_DATABASE_BACKUP: {
                const requestedDaemon = feature.getDaemon(connection.client, message.id);
                if(requestedDaemon === null) {
                    break;
                }

                requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_DATABASE_BACKUP, database: message.database });
                break;
            }

            case DaemonWebsocketMessageType.DAEMON_REQUEST_STATS_REPLY: {
                if(message.network == null || message.cpu == null || message.disks == null) { return; }
                if(connection.daemon === null) {
                    return;
                }
                const timestamp = Math.round(Date.now() / 1000).toString();

                database.add({ destination: "statistics", item:
                    {
                        id: randomBytes(16).toString("hex"),
                        author: connection.daemon.author,
                        server: connection.daemon.id,
                        timestamp: timestamp,
                        rx: message.network.rx,
                        tx: message.network.tx,
                        cpu: message.cpu.total,
                        memory: ((message.memory.used / (message.memory.total === 0 ? 1 : message.memory.total)) * 100),
                        swap: ((message.memory.swapUsed / (message.memory.swapTotal === 0 ? 1 : message.memory.swapTotal)) * 100)
                    }
                });
                for (const disk of message.disks) {
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

                database.edit({ destination: "servers",
                    item: {
                        memory: message.memory.total,
                        swap: message.memory.swapTotal
                    },
                    selectors: { id: connection.daemon.id }
                });
            }
        }
    });
    connection.stream.socket.on("close", () => {
        if(connection.daemon !== null) {
            console.log(`${red("<")} Daemon disconnected! (server: ${bold(yellow(connection.daemon.id))})`);
            feature.daemons.splice(feature.daemons.indexOf(connection.daemon), 1);
            return;
        }
        if(connection.client !== null) {
            console.log(`${red("<")} Client disconnected! (user: ${bold(yellow(connection.client.id))})`);
            feature.clients.splice(feature.clients.indexOf(connection.client), 1);
            return;
        }
        console.log(`${red("<")} Socket disconnected!`);
    });
}