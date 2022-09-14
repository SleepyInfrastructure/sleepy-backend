/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { RouteServerEditOptions } from "./index";
import { ServerEditSchema, ServerEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteServerEdit extends APIRoute {
    options: RouteServerEditOptions;

    constructor(feature: FeatureAPI, options: RouteServerEditOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<ServerEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(ServerEditSchema, req, rep)) {
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
                if(req.body.color !== undefined) {
                    edit.color = req.body.color;
                }
                await feature.database.edit({ destination: "servers", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get server */
                const server = await feature.database.fetch({ source: "servers", selectors: { id: req.body.id, author: session.user } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(server);
            }
        );
    }
}

export default RouteServerEdit;
