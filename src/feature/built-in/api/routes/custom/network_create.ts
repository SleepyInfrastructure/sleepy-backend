/* Types */
import { NetworkCreateSchema, NetworkCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteNetworkCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<NetworkCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(NetworkCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Create network */
                const newNetwork = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: req.body.name,
                    ipv4: req.body.ipv4 ?? null
                };
                feature.database.add({ destination: "networks", item: newNetwork });

                /* Send */
                rep.send(newNetwork);
            }
        );
    }
}

export default RouteNetworkCreate;
