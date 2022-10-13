/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "feature/built-in/api/routes";
import FeatureAPI from "feature/built-in/api";
import { IDSchema, IDSchemaType } from "ts/common/zod/base";
import { RequestWithSchema } from "feature/built-in/api/routes/types";
import { getSession, validateSchemaBody } from "feature/built-in/api/routes/util"

class RouteDaemonTokenCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<IDSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(IDSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Get server */
                const server = await feature.database.fetch<Server>({ source: "servers", selectors: { "id": req.body.id } });
                if(server === null) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Check if server belongs to logged in user */
                if(server.author !== session.user) {
                    rep.code(403); rep.send();
                    return;
                }

                /* Create a new token */
                const token: DaemonToken = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.id,
                    timestamp: Math.round(Date.now() / 1000),
                    used: Math.round(Date.now() / 1000)
                };
                feature.database.add({ destination: "daemontokens", item: token });
                
                /* Send */
                rep.send(token);
            }
        );
    }
}

export default RouteDaemonTokenCreate;
