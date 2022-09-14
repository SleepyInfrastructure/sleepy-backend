/* Types */
import { RouteDaemonTokenCreateOptions } from "./index";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { DaemonTokenCreateSchema, DaemonTokenCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";
import { getSession, validateSchemaBody } from "../util";

class RouteDaemonTokenCreate extends APIRoute {
    options: RouteDaemonTokenCreateOptions;

    constructor(feature: FeatureAPI, options: RouteDaemonTokenCreateOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<DaemonTokenCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(DaemonTokenCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Get server */
                const server = await feature.database.fetch({ source: "servers", selectors: { "id": req.body.id } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Check if server belongs to logged in user */
                if(server.author !== session.user) {
                    rep.code(403); rep.send();
                    return;
                }

                /* Create a new token */
                const token = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.id,
                    timestamp: Math.round(Date.now() / 1000),
                    used: Math.round(Date.now() / 1000)
                };
                feature.database.add({ destination: "daemontokens", item: token });
                rep.send(token);
            }
        );
    }
}

export default RouteDaemonTokenCreate;
