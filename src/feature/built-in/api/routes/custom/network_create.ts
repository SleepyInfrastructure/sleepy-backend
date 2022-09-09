/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteNetworkCreateOptions } from "./index";

/* Node Imports */
import { randomBytes } from "crypto";
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { name: string, ipv4?: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            name: { type: "string", minLength: 3, maxLength: 64 },
            ipv4: { type: "string", minLength: 3, maxLength: 256 }
        }
    }
};

class RouteNetworkCreate extends APIRoute {
    options: RouteNetworkCreateOptions;

    constructor(feature: FeatureAPI, options: RouteNetworkCreateOptions) {
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

                /* Create network */
                const newNetwork = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: req.body.name,
                    ipv4: req.body.ipv4 ?? null
                };
                database.add({ destination: "networks", item: newNetwork });
                
                /* Get network */
                const network = await database.fetch({ source: "networks", selectors: { "id": newNetwork.id } });
                if(network === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(network);
            }
        );
    }
}

export default RouteNetworkCreate;
