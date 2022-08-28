/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteFetchOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Querystring: { id: string };
}>;

const schema: FastifySchema = {
    querystring: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 }
        }
    }
};

class RouteFetch extends APIRoute {
    options: RouteFetchOptions;

    constructor(feature: FeatureAPI, options: RouteFetchOptions) {
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

        feature.instance.get(this.path,
            { schema: schema, config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: Request, rep) => {
                /* Construct selectors */
                const selectors = { [this.options.idField === undefined ? "id": this.options.idField]: req.query.id };

                /* Add a selector if route needs an author */
                if(this.options.authorField !== undefined) {
                    if(req.cookies.Token === undefined) {
                        rep.code(403); rep.send();
                        return;
                    }
                    const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                    if(session === undefined) {
                        rep.code(403); rep.send();
                        return;
                    }

                    selectors[this.options.authorField] = session.user;
                }

                /* Fetch */
                const item = await database.fetch({ source: this.options.table, selectors: selectors });
                if (item === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                rep.send(item);
            }
        );
    }
}

export default RouteFetch;
