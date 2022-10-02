/* Types */
import { RouteDaemonFileUploadOptions } from "./index";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { processFile } from "./_file_util";

class RouteDaemonFileUpload extends APIRoute {
    hook(feature: FeatureAPI): void {
        const options = this.options as RouteDaemonFileUploadOptions;
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 10000, max: 4 } } },
            async (req, rep) => {
                /* Validate schema */
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get server */
                const daemonToken = await feature.database.fetch({ source: "daemontokens", selectors: { id: req.cookies.Token } });
                if(daemonToken === undefined) {
                    rep.code(403); rep.send();
                    return;
                }
                const server = await feature.database.fetch({ source: "servers", selectors: { id: daemonToken.server } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Process file */
                const result = await processFile(feature.database, options, server, req, rep);
                if(result !== null) {
                    rep.code(400); rep.send(result.message);
                    return;
                }
                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteDaemonFileUpload;
