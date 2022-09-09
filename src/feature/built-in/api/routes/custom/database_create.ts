/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteDatabaseCreateOptions } from "./index";
import { DatabaseCreateSchema, DatabaseCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteDatabaseCreate extends APIRoute {
    options: RouteDatabaseCreateOptions;

    constructor(feature: FeatureAPI, options: RouteDatabaseCreateOptions) {
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
            { config: { rateLimit: { timeWindow: 10000, max: 1 } } },
            async (req: RequestWithSchema<DatabaseCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(DatabaseCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check server */
                const server = await database.fetch({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                if(server === undefined) {
                    rep.code(404);
                    rep.send();
                    return;
                }

                /* Create database */
                const newServerDatabase = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.server,
                    name: req.body.name
                };
                database.add({ destination: "databases", item: newServerDatabase });
                
                /* Get database */
                const serverDatabase = await database.fetch({ source: "databases", selectors: { "id": newServerDatabase.id } });
                if(serverDatabase === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(serverDatabase);
            }
        );
    }
}

export default RouteDatabaseCreate;
