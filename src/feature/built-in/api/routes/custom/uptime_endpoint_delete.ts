/* Types */
import { RouteUptimeEndpointDeleteOptions } from "./index";
import { UptimeEndpointDeleteSchema, UptimeEndpointDeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";
import { deleteUptimeEndpoint } from "./_util";

class RouteUptimeEndpointDelete extends APIRoute {
    options: RouteUptimeEndpointDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteUptimeEndpointDeleteOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 3 } } },
            async (req: RequestWithSchemaQuery<UptimeEndpointDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(UptimeEndpointDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete uptime endpoint */
                const success = await deleteUptimeEndpoint(feature.database, req.query.id, session.user);
                if(!success) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteUptimeEndpointDelete;
