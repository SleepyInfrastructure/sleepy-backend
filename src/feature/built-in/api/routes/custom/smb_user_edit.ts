/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { SMBUserEditSchema, SMBUserEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBUserEdit extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<SMBUserEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBUserEditSchema, req, rep)) {
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
                await feature.database.edit({ destination: "smbusers", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get share */
                const user = await feature.database.fetch({ source: "smbusers", selectors: { id: req.body.id, author: session.user } });
                if(user === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(user);
            }
        );
    }
}

export default RouteSMBUserEdit;
