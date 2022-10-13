/* Types */
import { DatabaseUnserializedItemValue } from "database/types";
import { ServerEditSchema, ServerEditSchemaType } from "ts/common/zod/server";
import { RequestWithSchema } from "feature/built-in/api/routes/types";
/* Local Imports */
import APIRoute from "feature/built-in/api/routes";
import FeatureAPI from "feature/built-in/api";
import { getSession, validateSchemaBody } from "feature/built-in/api/routes/util"

class RouteServerEdit extends APIRoute {
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
                const id = req.body.id;
                const edit: Record<string, DatabaseUnserializedItemValue> = req.body;
                delete edit.id;
                await feature.database.edit({ destination: "servers", item: edit, selectors: { id, author: session.user }});

                /* Get server */
                const server = await feature.database.fetch<Server>({ source: "servers", selectors: { id, author: session.user } });
                if(server === null) {
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
