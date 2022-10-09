/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { Status } from "../../../ts/backend/base";
import { DatabaseType } from "../../../database/types";
import { Client, Connection, FeatureDaemonOptions } from "./types";
/* Node Imports */
import * as fastify from "fastify";
import { SocketStream } from "@fastify/websocket";
/* Local Imports */
import { createFastifyPlainInstance, FoxxyFastifyPlainInstance, startFastifyInstance } from "../../../util/fastify";
import { handleWebsocket } from "./ws";
import Database from "../../../database";
import FeatureDaemonAddon, { FeatureDaemonAddonType } from "./addons/addon";
import addons from "./addons";

class FeatureDaemon extends Feature {
    options: FeatureDaemonOptions;
    instance: FoxxyFastifyPlainInstance;
    database: Database;
    connections: Connection[];
    addons: Map<FeatureDaemonAddonType, FeatureDaemonAddon>;

    constructor(parent: Instance, options: FeatureDaemonOptions) {
        super(parent, options);
        this.options = options;
        this.instance = null as unknown as FoxxyFastifyPlainInstance;
        this.database = null as unknown as Database;
        this.connections = [];
        this.addons = new Map();
        for(const Addon of addons) {
            const addon = new Addon(this);
            this.addons.set(addon.name, addon);
        }

        const database = this.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        this.database = database;
    }

    async start(): Promise<void> {
        const result = await createFastifyPlainInstance(this.options, true);
        if (result instanceof Error) {
            this.state = { status: Status.ERROR, message: result.message };
            return;
        }
        this.instance = result;
        this.instance.register((instance: fastify.FastifyInstance) => {
            instance.get("/socket", { websocket: true }, (stream: SocketStream, request: fastify.FastifyRequest) => {
                const connection = new Connection(this, stream);
                this.connect(connection);
                handleWebsocket(this, this.database, connection, request);
            });
        })

        startFastifyInstance(this.instance, this.options);
    }

    connect(connection: Connection): void {
        for(const [, addon] of this.addons) {
            if(addon.connect !== undefined) {
                addon.connect(connection);
            }
        }
        this.connections.push(connection);
    }

    disconnect(connection: Connection): void {
        for(const [, addon] of this.addons) {
            if(addon.disconnect !== undefined) {
                addon.disconnect(connection);
            }
        }
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    getDaemonForClient(client: Client, id: string): Connection | null {
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
