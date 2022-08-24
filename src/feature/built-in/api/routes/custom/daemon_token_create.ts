/* Types */
import { DatabaseType, Status } from "../../../../../ts/base";
import { RouteDaemonTokenCreateOptions } from "./index";

/* Node Imports */
import { randomBytes } from "crypto";
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { id: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 }
        }
    }
};

class RouteDaemonTokenCreate extends APIRoute {
    options: RouteDaemonTokenCreateOptions;

    constructor(options: RouteDaemonTokenCreateOptions) {
        super(options);
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
                if(req.body.id === undefined) { rep.code(400); rep.send(); return; }
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get session */
                const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                if(session === undefined) { rep.code(403); rep.send(); return; }

                /* Get server */
                const server = await database.fetch({ source: "servers", selectors: { "id": req.body.id } });
                if(server === undefined) { rep.code(404); rep.send(); return; }

                /* Check if server belongs to logged in user */
                if(server.author !== session.user) {
                    rep.code(403); rep.send();
                    return;
                }

                /* Create a new token */
                const token = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.id,
                    timestamp: Math.round(Date.now() / 1000),
                    used: Math.round(Date.now() / 1000)
                };
                database.add({ destination: "daemontokens", item: token });
                rep.send(token);
            }
        );
    }
}

export default RouteDaemonTokenCreate;
