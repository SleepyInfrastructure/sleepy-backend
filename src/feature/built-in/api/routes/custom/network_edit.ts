/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType, DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteNetworkEditOptions } from "./index";
import { NetworkEditSchema, NetworkEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteNetworkEdit extends APIRoute {
    options: RouteNetworkEditOptions;

    constructor(feature: FeatureAPI, options: RouteNetworkEditOptions) {
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
            async (req: RequestWithSchema<NetworkEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(NetworkEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = {};
                if(req.body.name !== undefined) {
                    edit.name = req.body.name;
                }
                if(req.body.ipv4 !== undefined) {
                    edit.ipv4 = req.body.ipv4;
                }
                await database.edit({ destination: "networks", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get network */
                const network = await database.fetch({ source: "networks", selectors: { id: req.body.id, author: session.user } });
                if(network === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(network);
            }
        );
    }
}

export default RouteNetworkEdit;
