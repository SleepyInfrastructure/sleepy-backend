/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
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

    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<NetworkEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(NetworkEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
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
                await feature.database.edit({ destination: "networks", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get network */
                const network = await feature.database.fetch({ source: "networks", selectors: { id: req.body.id, author: session.user } });
                if(network === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(network);
            }
        );
    }
}

export default RouteNetworkEdit;
