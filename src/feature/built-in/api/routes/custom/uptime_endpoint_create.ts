/* Types */
import { UptimeEndpointCreateSchema, UptimeEndpointCreateSchemaType } from "ts/common/zod/uptime_endpoint";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteUptimeEndpointCreate extends APIRoute {
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
                const newEndpoint: UptimeEndpoint = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: req.body.name,
                    interval: 10,
                    host: req.body.host ?? null,
                    requestEndpoint: req.body.requestEndpoint ?? null
                };
                feature.database.add({ destination: "uptimeendpoints", item: newEndpoint });

                /* Send */
                rep.send(newEndpoint);
            }
        );
    }
}

export default RouteUptimeEndpointCreate;
