/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteFetchMultipleOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Querystring: { id?: string, start?: number, end?: number };
}>;

const schema: FastifySchema = {
    querystring: {
        type: "object",
        required: [],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 },
            start: { type: "number", minimum: 0 },
            end: { type: "number", minimum: 0 }
        }
    }
};

class RouteFetchMultiple extends APIRoute {
    options: RouteFetchMultipleOptions;

    constructor(feature: FeatureAPI, options: RouteFetchMultipleOptions) {
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
                let selectors: Record<string, string> = {};
                if(this.options.disableIdField !== true) {
                    /* Validate schema */
                    if(req.query.id === undefined) { rep.code(400); rep.send(); return; }
                    selectors =  { [this.options.idField === undefined ? "id": this.options.idField]: req.query.id };
                }

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
                
                /* Get offset and limit */
                const offset = req.query.start ?? 0;
                let limit = this.options.limit;
                if(req.query.end !== undefined) {
                    if(req.query.end <= offset) { rep.code(400); rep.send(); return; }
                    limit = Math.min(Math.max(req.query.end - offset, 1, this.options.limit ?? req.query.end));
                }

                /* Fetch */
                const items = await database.fetchMultiple({ source: this.options.table, selectors: selectors, offset: limit !== undefined ? offset : undefined, limit: limit, sort: this.options.sort });
                rep.send(items);
            }
        );
    }
}

export default RouteFetchMultiple;
