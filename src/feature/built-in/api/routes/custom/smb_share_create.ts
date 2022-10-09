/* Types */
import { SMBShareCreateSchema, SMBShareCreateSchemaType } from "ts/common/zod/smb";
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
                const smbInstance = await feature.database.fetch<SMBInstance>({ source: "smbinstances", selectors: { id: req.body.parent, author: session.user } })
                if(smbInstance === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create share */
                const smbShare: SMBShare = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    parent: req.body.parent,
                    name: req.body.name,
                    path: req.body.path,
                    browsable: req.body.browsable,
                    readonly: req.body.readonly,
                    guest: req.body.guest,
                    users: [],
                    admins: []
                };
                feature.database.add({ destination: "smbshares", item: smbShare });

                /* Send */
                rep.send(smbShare);
            }
        );
    }
}

export default RouteSMBShareCreate;
