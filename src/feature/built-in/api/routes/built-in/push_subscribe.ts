/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RoutePushSubscribeOptions } from "./index";
import { PushSubscribeSchema, PushSubscribeSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RoutePushSubscribe extends APIRoute {
    options: RoutePushSubscribeOptions;

    constructor(feature: FeatureAPI, options: RoutePushSubscribeOptions) {
        super(feature, options);
        this.options = options;
    }

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }

        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 4 } } },
            async (req: RequestWithSchema<PushSubscribeSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(PushSubscribeSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Subscribe to push notifications */
                const options = { destination: "users", selectors: { "id": session.user }, item: { pushEnabled: "1", pushUrl: req.body.url, pushKey: req.body.key, pushAuth: req.body.auth } };
                database.edit(options);

                rep.code(200);
                rep.send();
            }
        );
    }
}

export default RoutePushSubscribe;
