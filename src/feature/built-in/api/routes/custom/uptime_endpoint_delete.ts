/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
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

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }

        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchemaQuery<UptimeEndpointDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(UptimeEndpointDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete uptime endpoint */
                const success = await deleteUptimeEndpoint(database, req.query.id, session.user);
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
