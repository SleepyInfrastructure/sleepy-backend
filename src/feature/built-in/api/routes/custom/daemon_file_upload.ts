/* Types */
import { Status } from "../../../../../ts/base";
import { RouteDaemonFileUploadOptions } from "./index";
import { DatabaseType } from "../../../../../database/types";
import { DaemonFileUploadType } from "../../../../custom/daemon/types";

/* Node Imports */
import fs from "fs";
import util from "util";
import { pipeline } from "stream";
import path from "path";
import { bold, green, yellow } from "nanocolors";
const pump = util.promisify(pipeline);

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { pad } from "../../../../util";

class RouteDaemonFileUpload extends APIRoute {
    options: RouteDaemonFileUploadOptions;

    constructor(feature: FeatureAPI, options: RouteDaemonFileUploadOptions) {
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
                /* Validate schema */
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get server */
                const daemonToken = await database.fetch({ source: "daemontokens", selectors: { "id": req.cookies.Token } });
                if(daemonToken === undefined) {
                    rep.code(403); rep.send();
                    return;
                }
                const server = await database.fetch({ source: "servers", selectors: { "id": daemonToken.server } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                const data = await req.file();
                const fileDataRaw: any = data.fields.data;
                const fileData = JSON.parse(fileDataRaw.value);
                const date = new Date();

                console.log(`${green("^")} Created a new backup of database ${bold(yellow(fileData.database))}!`);
                switch(fileData.type) {
                    case DaemonFileUploadType.BACKUP_DATABASE:
                        const directory = path.join("/usr/src/sleepy/user/", server.id, fileData.database, `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`);
                        await new Promise((resolve, reject) => {
                            fs.mkdir(directory, { recursive: true }, async(err) => {
                                if(err) {
                                    console.log(err);
                                    reject(err);
                                    return;
                                }
        
                                await pump(data.file, fs.createWriteStream(path.join(directory, `${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}.sql`)));
                                resolve(null);
                            });
                        });
                        break;
                }

                rep.send();
            }
        );
    }
}

export default RouteDaemonFileUpload;
