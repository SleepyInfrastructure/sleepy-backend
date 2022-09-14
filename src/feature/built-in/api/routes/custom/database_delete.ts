/* Types */
import { RouteDatabaseDeleteOptions } from "./index";
import { DatabaseDeleteSchema, DatabaseDeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";

class RouteDatabaseDelete extends APIRoute {
    options: RouteDatabaseDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteDatabaseDeleteOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 3 } } },
            async (req: RequestWithSchemaQuery<DatabaseDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(DatabaseDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete database */
                const serverDatabase = await feature.database.delete({ source: "databases", selectors: { id: req.query.id, author: session.user } });
                if(serverDatabase < 1) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteDatabaseDelete;
