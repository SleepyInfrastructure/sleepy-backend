/* Types */
import { SMBShareCreateSchema, SMBShareCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBShareCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<SMBShareCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBShareCreateSchema, req, rep)) {
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

                /* Create share */
                const newSmbShare = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    parent: req.body.parent,
                    name: req.body.name,
                    path: req.body.path,
                    browsable: req.body.browsable ? 1 : 0,
                    readonly: req.body.readonly ? 1 : 0,
                    guest: req.body.guest ? 1 : 0,
                    users: [],
                    admins: []
                };
                feature.database.add({ destination: "smbshares", item: newSmbShare });

                /* Send */
                rep.send(newSmbShare);
            }
        );
    }
}

export default RouteSMBShareCreate;
