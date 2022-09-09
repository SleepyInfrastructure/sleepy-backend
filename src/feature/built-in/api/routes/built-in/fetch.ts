/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteFetchOptions } from "./index";
import { FetchSchema, FetchSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";

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
            { config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: RequestWithSchemaQuery<FetchSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(FetchSchema, req, rep)) {
                    return;
                }

                /* Construct selectors */
                const selectors = { [this.options.idField === undefined ? "id": this.options.idField]: req.query.id };

                /* Add a selector if route needs an author */
                if(this.options.authorField !== undefined) {
                    const session = await getSession(database, req, rep);
                    if(session === null) {
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
