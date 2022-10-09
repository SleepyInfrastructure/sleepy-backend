/* Types */
import { RouteUserFileAccessOptions } from "./index";
import { IDSchema, IDSchemaType } from "ts/common/zod/base";
import { RequestWithSchemaQuery } from "../types";

/* Node Imports */
import { createReadStream } from "fs";
import path from "path";
import archiver from "archiver";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";

class RouteUserFileAccess extends APIRoute {
    hook(feature: FeatureAPI): void {
        const options = this.options as RouteUserFileAccessOptions;
        feature.instance.get(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 1 } } },
            async (req: RequestWithSchemaQuery<IDSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(IDSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Get file */
                const file = await feature.database.fetch<UserFile>({ source: "userfiles", selectors: { id: req.query.id, author: session.user }, ignoreSensitive: true })
                if(file === null || file.path === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Get system file */
                const filePath = path.join(options.root, file.path);
                if(filePath.indexOf(options.root) !== 0) {
                    rep.code(418); rep.send();
                    return;
                }

                /* Prepare response */
                rep.raw.writeHead(200, {
                    "Content-Type": "application/zip",
                    "Content-Disposition": `attachment; filename="${file.name}.zip"`
                });

                /* Prepare archive */
                const fileStream = createReadStream(filePath);
                fileStream.on("open", () => {
                    if(file.path === undefined) { return; }
                    const archive = archiver("zip", {
                        zlib: { level: 9 }
                    });
                    archive.on("error", (e) => {
                        console.log(e);
                        rep.code(400); rep.send();
                    });
                    
                    /* Send archive */
                    archive.pipe(rep.raw);
                    archive.append(fileStream, { name: path.basename(file.path) });
                    archive.finalize();
                });
            }
        );
    }
}

export default RouteUserFileAccess;
