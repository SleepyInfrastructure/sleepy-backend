/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
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

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }

        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchemaQuery<DatabaseDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(DatabaseDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete database */
                const serverDatabase = await database.delete({ source: "databases", selectors: { id: req.query.id, author: session.user } });
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
