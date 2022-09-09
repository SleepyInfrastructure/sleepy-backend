/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType, DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteDatabaseEditOptions } from "./index";
import { DatabaseEditSchema, DatabaseEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteDatabaseEdit extends APIRoute {
    options: RouteDatabaseEditOptions;

    constructor(feature: FeatureAPI, options: RouteDatabaseEditOptions) {
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
            async (req: RequestWithSchema<DatabaseEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(DatabaseEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check server */
                if(req.body.server !== undefined) {
                    const server = await database.fetch({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                    if(server === undefined) {
                        rep.code(404);
                        rep.send();
                        return;
                    }
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = {};
                if(req.body.name !== undefined) {
                    edit.name = req.body.name;
                }
                if(req.body.server !== undefined) {
                    edit.server = req.body.server;
                }
                await database.edit({ destination: "databases", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get database */
                const serverDatabase = await database.fetch({ source: "databases", selectors: { id: req.body.id, author: session.user } });
                if(serverDatabase === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(serverDatabase);
            }
        );
    }
}

export default RouteDatabaseEdit;
