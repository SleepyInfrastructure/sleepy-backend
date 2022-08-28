/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteServerCreateOptions } from "./index";

/* Node Imports */
import { randomBytes } from "crypto";
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { name: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            name: { type: "string", minLength: 3, maxLength: 64 }
        }
    }
};

class RouteServerCreate extends APIRoute {
    options: RouteServerCreateOptions;

    constructor(feature: FeatureAPI, options: RouteServerCreateOptions) {
        super(feature, options);
        this.options = options;
    }

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }

        feature.instance.post(this.path,
            { schema: schema, config: { rateLimit: { timeWindow: 10000, max: 1 } } },
            async (req: Request, rep) => {
                /* Validate schema */
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get session */
                const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                if(session === undefined) { rep.code(403); rep.send(); return; }

                /* Create config */
                const serverConfig = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    statsInterval: 60,
                    statsCleanAge: 600,
                    databaseBackupInterval: null
                };
                database.add({ destination: "serverconfigs", item: serverConfig });

                /* Create network */
                const serverNetwork = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: `${req.body.name}-network`,
                    ipv4: null
                };
                database.add({ destination: "networks", item: serverNetwork });

                /* Create server */
                const server = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    timestamp: Math.round(Date.now() / 1000),
                    network: serverNetwork.id,
                    config: serverConfig.id,
                    name: req.body.name,
                    color: "ff3645",
                    memory: 0,
                    swap: 0,
                    netInterfaces: []
                };
                database.add({ destination: "servers", item: server });

                /* Send structured */
                rep.send({
                    ...server,
                    config: serverConfig,
                    network: serverNetwork
                });
            }
        );
    }
}

export default RouteServerCreate;
