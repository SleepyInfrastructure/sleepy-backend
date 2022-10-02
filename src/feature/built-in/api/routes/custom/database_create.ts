/* Types */
import { DatabaseCreateSchema, DatabaseCreateSchemaType } from "./_schemas";
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
                const server = await feature.database.fetch({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create database */
                const newServerDatabase = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.server,
                    name: req.body.name,
                    credentials: 0
                };
                feature.database.add({ destination: "databases", item: newServerDatabase });

                /* Send */
                rep.send(newServerDatabase);
            }
        );
    }
}

export default RouteDatabaseCreate;
