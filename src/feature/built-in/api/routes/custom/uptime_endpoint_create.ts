/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
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
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<UptimeEndpointCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(UptimeEndpointCreateSchema, req, rep)) {
                    return;
                }
                if(req.body.host === undefined && req.body.requestEndpoint === undefined) { rep.code(400); rep.send(); return; }

                /* Get session */
                const session = await getSession(database, req, rep);
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
                database.add({ destination: "uptimeendpoints", item: newEndpoint });
                
                /* Get endpoint */
                const endpoint = await database.fetch({ source: "uptimeendpoints", selectors: { "id": newEndpoint.id } });
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
