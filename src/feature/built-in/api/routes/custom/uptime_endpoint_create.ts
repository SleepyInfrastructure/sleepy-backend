/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteUptimeEndpointCreateOptions } from "./index";

/* Node Imports */
import { randomBytes } from "crypto";
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { name: string, host?: string, requestEndpoint?: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["name"],
        properties: {
            name: { type: "string", minLength: 3, maxLength: 64 },
            host: { type: "string", minLength: 3, maxLength: 256 },
            requestEndpoint: { type: "string", pattern: "(http:\/\/|https:\/\/).*", maxLength: 256 }
        }
    }
};

class RouteUptimeEndpointCreate extends APIRoute {
    options: RouteUptimeEndpointCreateOptions;

    constructor(feature: FeatureAPI, options: RouteUptimeEndpointCreateOptions) {
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
                if(req.body.host === undefined && req.body.requestEndpoint === undefined) { rep.code(400); rep.send(); return; }
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get session */
                const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                if(session === undefined) { rep.code(403); rep.send(); return; }

                /* Create endpoint */
                const newEndpoint = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: req.body.name,
                    host: req.body.host ?? null,
                    requestEndpoint: req.body.requestEndpoint ?? null
                };
                database.add({ destination: "uptimeendpoints", item: newEndpoint });
                
                /* Get endpoint */
                const endpoint = await database.fetch({ source: "uptimeendpoints", selectors: { "id": newEndpoint.id } });
                if(endpoint === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(endpoint);
            }
        );
    }
}

export default RouteUptimeEndpointCreate;
