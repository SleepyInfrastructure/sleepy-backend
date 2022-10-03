/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { SMBShareEditSchema, SMBShareEditSchemaType } from "./_schemas";
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
                const edit: Record<string, DatabaseUnserializedItemValue> = {};
                if(req.body.name !== undefined) {
                    edit.name = req.body.name;
                }
                if(req.body.path !== undefined) {
                    edit.path = req.body.path;
                }
                if(req.body.browsable !== undefined) {
                    edit.browsable = req.body.browsable ? 1 : 0;
                }
                if(req.body.readonly !== undefined) {
                    edit.readonly = req.body.readonly ? 1 : 0;
                }
                if(req.body.guest !== undefined) {
                    edit.guest = req.body.guest ? 1 : 0;
                }
                if(req.body.users !== undefined) {
                    edit.users = req.body.users;
                }
                if(req.body.admins !== undefined) {
                    edit.admins = req.body.admins;
                }
                await feature.database.edit({ destination: "smbshares", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get share */
                const share = await feature.database.fetch({ source: "smbshares", selectors: { id: req.body.id, author: session.user } });
                if(share === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(share);
            }
        );
    }
}

export default RouteSMBShareEdit;
