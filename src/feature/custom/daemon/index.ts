/* Types */
import Feature from "../..";
import Instance from "../../../instance";
import { Status } from "../../../ts/base";
import { DatabaseType } from "../../../database/types";
import { Client, Connection, Daemon, FeatureDaemonOptions } from "./types";

/* Node Imports */
import * as fastify from "fastify";
import { SocketStream } from "@fastify/websocket";

/* Local Imports */
import { createFastifyInstance, startFastifyInstance } from "../../../util/fastify";
import { handleWebsocket } from "./handlers/ws";

class FeatureDaemon extends Feature {
    options: FeatureDaemonOptions;
    instance: fastify.FastifyInstance | null;
    daemons: Daemon[];
    clients: Client[];

    constructor(parent: Instance, options: FeatureDaemonOptions) {
        super(parent, options);
        this.options = options;
        this.instance = null;
        this.daemons = [];
        this.clients = [];
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
                handleWebsocket(this, database, connection, request);
            });
        })

        startFastifyInstance(this.instance, this.options);
    }

    getDaemon(client: Client | null, id: string | null | undefined): Daemon | null {
        if(id == null || client === null) {
            return null;
        }

        const daemon = this.daemons.find(e => e.id === id);
        if(daemon === undefined || daemon.author !== client.id) {
            return null;
        }

        return daemon;
    }

    getDaemons(id: string) {
        return this.daemons.filter(e => e.author === id);
    }

    getClients(id: string) {
        return this.clients.filter(e => e.id === id);
    }
}

export default FeatureDaemon;
