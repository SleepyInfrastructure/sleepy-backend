/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType, DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteNetworkEditOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { id: string, name: string, ipv4?: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["id", "name"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 },
            name: { type: "string", minLength: 3, maxLength: 64 },
            ipv4: { type: "string", minLength: 3, maxLength: 256 }
        }
    }
};

class RouteNetworkEdit extends APIRoute {
    options: RouteNetworkEditOptions;

    constructor(feature: FeatureAPI, options: RouteNetworkEditOptions) {
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
                    ipv4: req.body.ipv4 ?? null
                };
                await database.edit({ destination: "networks", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get network */
                const network = await database.fetch({ source: "networks", selectors: { id: req.body.id, author: session.user } });
                if(network === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(network);
            }
        );
    }
}

export default RouteNetworkEdit;
