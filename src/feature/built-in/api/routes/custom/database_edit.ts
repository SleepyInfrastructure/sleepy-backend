/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { DatabaseEditSchema, DatabaseEditSchemaType } from "ts/common/zod/database";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteDatabaseEdit extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<DatabaseEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(DatabaseEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check server */
                if(req.body.server !== undefined) {
                    const server = await feature.database.fetch<Server>({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                    if(server === null) {
                        rep.code(404); rep.send();
                        return;
                    }
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = req.body;
                delete edit.id;
                await feature.database.edit({ destination: "databases", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get database */
                const serverDatabase = await feature.database.fetch<Database>({ source: "databases", selectors: { id: req.body.id, author: session.user } });
                if(serverDatabase === null) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(serverDatabase);
            }
        );
    }
}

export default RouteDatabaseEdit;
