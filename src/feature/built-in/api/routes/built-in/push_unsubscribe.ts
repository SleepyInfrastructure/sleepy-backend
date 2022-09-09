/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RoutePushUnsubscribeOptions } from "./index";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession } from "../util";

class RoutePushUnsubscribe extends APIRoute {
    options: RoutePushUnsubscribeOptions;

    constructor(feature: FeatureAPI, options: RoutePushUnsubscribeOptions) {
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
            async (req, rep) => {
                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }

                /* Unsubscribe from push notifications */
                const options = { destination: "users", selectors: { "id": session.user }, item: { pushEnabled: "0" } };
                database.edit(options);

                rep.code(200);
                rep.send();
            }
        );
    }
}

export default RoutePushUnsubscribe;
