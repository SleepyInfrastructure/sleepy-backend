/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { NetworkEditSchema, NetworkEditSchemaType } from "ts/common/zod/network";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteNetworkEdit extends APIRoute {
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
                const edit: Record<string, DatabaseUnserializedItemValue> = req.body;
                delete edit.id;
                await feature.database.edit({ destination: "networks", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get network */
                const network = await feature.database.fetch<Network>({ source: "networks", selectors: { id: req.body.id, author: session.user } });
                if(network === null) {
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
