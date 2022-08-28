/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseFetchOptions, DatabaseType } from "../../../../../database/types";
import { RoutePushSendOptions } from "./index";

/* Node Imports */
import { FastifyRequest } from "fastify";
import * as webPush from "web-push";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Querystring: { message: string, adminKey: string };
}>;

class RoutePushSend extends APIRoute {
    options: RoutePushSendOptions;

    constructor(feature: FeatureAPI, options: RoutePushSendOptions) {
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
            async (req: Request, rep) => {
                /* Validate schema */
                if(req.query.message === undefined || req.query.adminKey === undefined) { rep.code(400); rep.send(); return; }
                if(req.query.adminKey !== process.env.FOXXY_ADMIN_KEY) { rep.code(403); rep.send(); return; }

                /* Fetch eligble users */
                const selectors = { "pushEnabled": "1" };
                const options: DatabaseFetchOptions = { source: "users", selectors: selectors };
                const users = await database.fetchMultiple(options);

                /* Send push notification */
                const publicKey = process.env.FOXXY_PUSH_PUBLIC_KEY;
                const privateKey = process.env.FOXXY_PUSH_PRIVATE_KEY;
                if(publicKey === undefined || privateKey === undefined) { return; }

                const notificationPayload = req.query.message;
                const notificationOptions = {
                    vapidDetails: {
                        subject: "https://lamkas.dev",
                        publicKey: publicKey,
                        privateKey: privateKey
                    }
                };

                for(const user of users) {
                    const subscription = {
                        endpoint: user.pushUrl,
                        keys: {
                            p256dh: user.pushKey,
                            auth: user.pushAuth
                        }
                    };
                    webPush.sendNotification(subscription, notificationPayload, notificationOptions);
                }
            }
        );
    }
}

export default RoutePushSend;
