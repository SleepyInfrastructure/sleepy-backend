/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType, DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteUptimeEndpointEditOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { id: string, name: string, host?: string, requestEndpoint?: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["id", "name"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 },
            name: { type: "string", minLength: 3, maxLength: 64 },
            host: { type: "string", minLength: 3, maxLength: 256 },
            requestEndpoint: { type: "string", pattern: "(http:\/\/|https:\/\/).*", maxLength: 256 }
        }
    }
};

class RouteUptimeEndpointEdit extends APIRoute {
    options: RouteUptimeEndpointEditOptions;

    constructor(feature: FeatureAPI, options: RouteUptimeEndpointEditOptions) {
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
                const session = await database.fetch({ source: "sessions", selectors: { id: req.cookies.Token } });
                if(session === undefined) { rep.code(403); rep.send(); return; }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = {
                    name: req.body.name,
                    host: req.body.host ?? null,
                    requestEndpoint: req.body.requestEndpoint ?? null
                };
                await database.edit({ destination: "uptimeendpoints", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get endpoint */
                const endpoint = await database.fetch({ source: "uptimeendpoints", selectors: { id: req.body.id, author: session.user } });
                if(endpoint === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(endpoint);
            }
        );
    }
}

export default RouteUptimeEndpointEdit;
