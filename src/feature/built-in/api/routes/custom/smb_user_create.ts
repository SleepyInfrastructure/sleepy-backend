/* Types */
import { SMBUserCreateSchema, SMBUserCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBUserCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<SMBUserCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBUserCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check instance */
                const instance = await feature.database.fetch({ source: "smbinstances", selectors: { id: req.body.parent, author: session.user } })
                if(instance === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create user */
                const newSmbUser = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    parent: req.body.parent,
                    name: req.body.name
                };
                feature.database.add({ destination: "smbusers", item: newSmbUser });

                /* Send */
                rep.send(newSmbUser);
            }
        );
    }
}

export default RouteSMBUserCreate;
