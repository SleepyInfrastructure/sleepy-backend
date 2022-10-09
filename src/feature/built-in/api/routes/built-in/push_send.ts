/* Types */
import { DatabaseFetchOptions } from "../../../../../database/types";
import { RoutePushSendOptions } from "./index";
import { PushSendSchema, PushSendSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import * as webPush from "web-push";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { validateSchemaBody } from "../util";

class RoutePushSend extends APIRoute {
    options: RoutePushSendOptions;

    constructor(feature: FeatureAPI, options: RoutePushSendOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 4 } } },
            async (req: RequestWithSchema<PushSendSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(PushSendSchema, req, rep)) {
                    return;
                }
                if(req.body.adminKey !== process.env.FOXXY_ADMIN_KEY) { rep.code(403); rep.send(); return; }

                /* Fetch eligble users */
                const selectors = { "pushEnabled": "1" };
                const options: DatabaseFetchOptions = { source: "users", selectors: selectors };
                const users = await feature.database.fetchMultiple<any>(options);

                /* Send push notification */
                const publicKey = process.env.FOXXY_PUSH_PUBLIC_KEY;
                const privateKey = process.env.FOXXY_PUSH_PRIVATE_KEY;
                if(publicKey === undefined || privateKey === undefined) { return; }

                const notificationPayload = req.body.message;
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
