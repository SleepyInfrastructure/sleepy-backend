/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteServerEditOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { id: string, name: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["id", "name"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 },
            name: { type: "string", minLength: 3, maxLength: 64 }
        }
    }
};

class RouteServerEdit extends APIRoute {
    options: RouteServerEditOptions;

    constructor(feature: FeatureAPI, options: RouteServerEditOptions) {
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

                /* Edit */
                await database.edit({ destination: "servers", item: { name: req.body.name }, selectors: { id: req.body.id, author: session.user }});

                /* Get server */
                const server = await database.fetch({ source: "servers", selectors: { "id": req.body.id } });
                if(server === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(server);
            }
        );
    }
}

export default RouteServerEdit;
