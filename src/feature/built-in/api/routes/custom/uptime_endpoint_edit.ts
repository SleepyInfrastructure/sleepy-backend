/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType, DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteUptimeEndpointEditOptions } from "./index";
import { UptimeEndpointEditSchema, UptimeEndpointEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteUptimeEndpointEdit extends APIRoute {
    options: RouteUptimeEndpointEditOptions;

    constructor(feature: FeatureAPI, options: RouteUptimeEndpointEditOptions) {
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
            async (req: RequestWithSchema<UptimeEndpointEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(UptimeEndpointEditSchema, req, rep)) {
                    return;
                }
                if(req.body.host === undefined && req.body.requestEndpoint === undefined) { rep.code(400); rep.send(); return; }

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
                if(req.body.host !== undefined) {
                    edit.host = req.body.host;
                }
                if(req.body.requestEndpoint !== undefined) {
                    edit.requestEndpoint = req.body.requestEndpoint;
                }
                await database.edit({ destination: "uptimeendpoints", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get endpoint */
                const endpoint = await database.fetch({ source: "uptimeendpoints", selectors: { id: req.body.id, author: session.user } });
                if(endpoint === undefined) { rep.code(404); rep.send(); return; }

                /* Send */
                rep.send(endpoint);
            }
        );
    }
}

export default RouteUptimeEndpointEdit;
