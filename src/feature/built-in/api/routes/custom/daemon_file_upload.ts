/* Types */
import { Status } from "../../../../../ts/base";
import { RouteDaemonFileUploadOptions } from "./index";
import { DatabaseType } from "../../../../../database/types";
import { DaemonFileType, TaskType } from "../../../../custom/daemon/types";
import { pad } from "../../../../../util/general";

/* Node Imports */
import { randomBytes } from "crypto";
import fs, { statSync } from "fs";
import util from "util";
import { pipeline } from "stream";
import path from "path";
import { bold, green, yellow } from "nanocolors";
const pump = util.promisify(pipeline);

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

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
            { config: { rateLimit: { timeWindow: 10000, max: 4 } } },
            async (req, rep) => {
                /* Validate schema */
                if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }

                /* Get server */
                const daemonToken = await database.fetch({ source: "daemontokens", selectors: { id: req.cookies.Token } });
                if(daemonToken === undefined) {
                    rep.code(403); rep.send();
                    return;
                }
                const server = await database.fetch({ source: "servers", selectors: { id: daemonToken.server } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Get files */
                const data = await req.file();
                const fileDataRaw: any = data.fields.data;
                const fileData = JSON.parse(fileDataRaw.value);

                switch(fileData.type) {
                    case DaemonFileType.BACKUP_DATABASE:
                        const task = await database.fetch({ source: "tasks", selectors: { id: fileData.task } });
                        if(task === undefined) {
                            rep.code(404); rep.send();
                            return;
                        }
                        console.log(`${green("^")} Created a new backup of database ${bold(yellow(fileData.database))}!`);
                        
                        const date = new Date();
                        const fileName = `${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}.sql`;
                        const partialPath = path.join(server.id, fileData.database, `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`, fileName);
                        const filePath = path.join(this.options.root, partialPath);
                        await new Promise((resolve, reject) => {
                            fs.mkdir(path.dirname(filePath), { recursive: true }, async(e) => {
                                if(e) {
                                    reject(e);
                                    return;
                                }
        
                                await pump(data.file, fs.createWriteStream(filePath));
                                resolve(null);
                            });
                        });
                        const fileStats = statSync(filePath);
                        
                        const userFile = {
                            id: randomBytes(16).toString("hex"),
                            author: daemonToken.author,
                            type: task.type === TaskType.BACKUP_DATABASE ? DaemonFileType.BACKUP_DATABASE : DaemonFileType.BACKUP_DATABASE_SCHEMA,
                            size: fileStats.size,
                            path: partialPath
                        };
                        database.add({ destination: "userfiles", item: userFile });
                        database.edit({ destination: "tasks", item: { result: userFile.id }, selectors: { id: fileData.task } });
                        break;
                }

                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteDaemonFileUpload;
