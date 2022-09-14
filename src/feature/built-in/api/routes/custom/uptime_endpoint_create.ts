/* Types */
import { RouteUptimeEndpointCreateOptions } from "./index";
import { UptimeEndpointCreateSchema, UptimeEndpointCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteUptimeEndpointCreate extends APIRoute {
    options: RouteUptimeEndpointCreateOptions;

    constructor(feature: FeatureAPI, options: RouteUptimeEndpointCreateOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<UptimeEndpointCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(UptimeEndpointCreateSchema, req, rep)) {
                    return;
                }
                if(req.body.host === undefined && req.body.requestEndpoint === undefined) { rep.code(400); rep.send(); return; }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Create endpoint */
                const newEndpoint = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: req.body.name,
                    host: req.body.host ?? null,
                    requestEndpoint: req.body.requestEndpoint ?? null
                };
                feature.database.add({ destination: "uptimeendpoints", item: newEndpoint });
                
                /* Get endpoint */
                const endpoint = await feature.database.fetch({ source: "uptimeendpoints", selectors: { "id": newEndpoint.id } });
                if(endpoint === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(endpoint);
            }
        );
    }
}

export default RouteUptimeEndpointCreate;
