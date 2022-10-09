/* Types */
import { DatabaseCreateSchema, DatabaseCreateSchemaType } from "ts/common/zod/database";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteDatabaseCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<DatabaseCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(DatabaseCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check server */
                const server = await feature.database.fetch<Server>({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                if(server === null) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create database */
                const serverDatabase: Database = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.server,
                    name: req.body.name,
                    credentials: false
                };
                feature.database.add({ destination: "databases", item: serverDatabase });

                /* Send */
                rep.send(serverDatabase);
            }
        );
    }
}

export default RouteDatabaseCreate;
