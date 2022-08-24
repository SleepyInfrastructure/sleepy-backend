/* Types */
import { DatabaseType, Status } from "../../../../../ts/base";
import { RoutePushUnsubscribeOptions } from "./index";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

class RoutePushUnsubscribe extends APIRoute {
    options: RoutePushUnsubscribeOptions;

    constructor(options: RoutePushUnsubscribeOptions) {
        super(options);
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
                /* Validate schema */
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get session */
                const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                if(session === undefined) { rep.code(403); rep.send(); return; }

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
