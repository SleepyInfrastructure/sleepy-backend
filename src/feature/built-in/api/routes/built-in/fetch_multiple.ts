/* Types */
import { RouteFetchMultipleOptions } from "./index";
import { FetchMultipleSchema, FetchMultipleSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";

class RouteFetchMultiple extends APIRoute {
    options: RouteFetchMultipleOptions;

    constructor(feature: FeatureAPI, options: RouteFetchMultipleOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.get(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: RequestWithSchemaQuery<FetchMultipleSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(FetchMultipleSchema, req, rep)) {
                    return;
                }

                /* Construct selectors */
                let selectors: Record<string, string> = {};
                if(this.options.disableIdField !== true) {
                    if(req.query.id === undefined) { rep.code(400); rep.send(); return; }
                    selectors =  { ...this.options.select, [this.options.idField === undefined ? "id": this.options.idField]: req.query.id };
                }

                /* Add a selector if route needs an author */
                if(this.options.authorField !== undefined) {
                    const session = await getSession(feature.database, req, rep);
                    if(session === null) {
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
                const items = await feature.database.fetchMultiple({ source: this.options.table, selectors: selectors, offset: limit !== undefined ? offset : undefined, limit: limit, sort: this.options.sort });
                rep.send(items);
            }
        );
    }
}

export default RouteFetchMultiple;
