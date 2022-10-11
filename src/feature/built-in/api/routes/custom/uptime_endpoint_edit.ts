/* Types */
import { DatabaseUnserializedItemValue } from "database/types";
import { UptimeEndpointEditSchema, UptimeEndpointEditSchemaType } from "ts/common/zod/uptime_endpoint";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteUptimeEndpointEdit extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<UptimeEndpointEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(UptimeEndpointEditSchema, req, rep)) {
                    return;
                }
                if(req.body.host === undefined && req.body.requestEndpoint === undefined) { rep.code(400); rep.send(); return; }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = req.body;
                delete edit.id;
                await feature.database.edit({ destination: "uptimeendpoints", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get endpoint */
                const endpoint = await feature.database.fetch<UptimeEndpoint>({ source: "uptimeendpoints", selectors: { id: req.body.id, author: session.user } });
                if(endpoint === null) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(endpoint);
            }
        );
    }
}

export default RouteUptimeEndpointEdit;
