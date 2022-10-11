/* Types */
import { DatabaseUnserializedItemValue } from "database/types";
import { SMBShareEditSchema, SMBShareEditSchemaType } from "ts/common/zod/smb";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBShareEdit extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<SMBShareEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBShareEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = req.body;
                delete edit.id;
                await feature.database.edit({ destination: "smbshares", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get share */
                const smbShare = await feature.database.fetch<SMBShare>({ source: "smbshares", selectors: { id: req.body.id, author: session.user } });
                if(smbShare === null) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(smbShare);
            }
        );
    }
}

export default RouteSMBShareEdit;
