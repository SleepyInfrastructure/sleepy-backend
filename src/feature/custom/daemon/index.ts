/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { Status } from "../../../ts/base";
import { DatabaseType } from "../../../database/types";
import { Client, Connection, FeatureDaemonOptions } from "./types";

/* Node Imports */
import * as fastify from "fastify";
import { SocketStream } from "@fastify/websocket";

/* Local Imports */
import { createFastifyInstance, startFastifyInstance } from "../../../util/fastify";
import { handleWebsocket } from "./handlers/ws";
import DaemonLogManager from "./addons/log";

class FeatureDaemon extends Feature {
    options: FeatureDaemonOptions;
    instance: fastify.FastifyInstance | null;
    connections: Connection[];
    daemonLogManager: DaemonLogManager;

    constructor(parent: Instance, options: FeatureDaemonOptions) {
        super(parent, options);
        this.options = options;
        this.instance = null;
        this.connections = [];
        this.daemonLogManager = new DaemonLogManager(this);
    }

    async start(): Promise<void> {
        const database = this.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        const result = await createFastifyInstance(this.options, true);
        if (result instanceof Error) {
            this.state = { status: Status.ERROR, message: result.message };
            return;
        }
        this.instance = result;

        this.instance.register(async(instance: fastify.FastifyInstance) => {
            instance.get('/socket', { websocket: true }, async(stream: SocketStream, request: fastify.FastifyRequest) => {
                const connection = new Connection(this, stream);
                this.connections.push(connection);
                handleWebsocket(this, database, connection, request);
            });
        })

        startFastifyInstance(this.instance, this.options);
    }

    getDaemonForClient(client: Client | null, id: string | null | undefined): Connection | null {
        if(id === null || id === undefined || client === null) {
            return null;
        }

        const connection = this.connections.find(e => e.daemon !== null && e.daemon.id === id);
        if(connection === undefined || connection.daemon === null || connection.daemon.author !== client.id) {
            return null;
        }

        return connection;
    }

    getDaemons() {
        return this.connections.filter(e => e.daemon !== null);
    }

    getDaemonsForAuthor(author: string) {
        return this.connections.filter(e => e.daemon !== null && e.daemon.author === author);
    }

    getDaemonListForAuthor(author: string) {
        return this.getDaemonsForAuthor(author).map(e => {
            if(e.daemon === null) { return null; }
            return { id: e.daemon.id, author: e.daemon.author };
        })
    }

    getClients() {
        return this.connections.filter(e => e.client !== null);
    }

    getClientsForId(id: string) {
        return this.connections.filter(e => e.client !== null && e.client.id === id);
    }
}

export default FeatureDaemon;
