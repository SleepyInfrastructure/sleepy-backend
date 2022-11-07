/* Types */
import Database from "database";
import { DaemonFileType } from "feature/custom/daemon/types";
import { RouteDaemonFileUploadOptions } from ".";
import { MiracleFastifyReply, MiracleFastifyRequest } from "util/fastify";

/* Node Imports */
import { randomBytes } from "crypto";
import fs, { statSync } from "fs";
import util from "util";
import { pipeline } from "stream";
import path from "path";
import { MultipartFile } from "@fastify/multipart";
import { RouteGenericInterface } from "fastify/types/route";
import { bold, green, red, yellow } from "nanocolors";
const pump = util.promisify(pipeline);

/* Local Imports */
import { pad } from "util/general";

export async function processFile(database: Database, options: RouteDaemonFileUploadOptions, server: Server, req: MiracleFastifyRequest<RouteGenericInterface>, rep: MiracleFastifyReply): Promise<Error | null> {
    /* Get files */
    const data = await req.file();
    if(data === undefined) {
        return new Error("Failed to get request file!");
    }
    const fileDataRaw: any = data.fields.data;
    const fileData = JSON.parse(fileDataRaw.value);
    
    /* Process file */
    console.log(`${yellow("^")} Processing file... (type: ${bold(yellow(fileData.type))})!`);
    switch(fileData.type) {
        case DaemonFileType.BACKUP_DATABASE:
        case DaemonFileType.CONTAINER_LOG:
            return await processFileTask(database, options, server, data, fileData, rep);
    }
    
    return new Error("File type not recognized!");
}

const taskToFileType: Record<TaskType, DaemonFileType> = {
    "BACKUP_DATABASE": DaemonFileType.BACKUP_DATABASE,
    "BACKUP_DATABASE_SCHEMA": DaemonFileType.BACKUP_DATABASE,
    "REQUEST_CONTAINER_LOG": DaemonFileType.CONTAINER_LOG
};
export async function processFileTask(database: Database, options: RouteDaemonFileUploadOptions, server: Server, data: MultipartFile, fileData: any, rep: MiracleFastifyReply): Promise<Error | null> {
    /* Get task */
    const task = await database.fetch<Task>({ source: "tasks", selectors: { id: fileData.task } });
    if(task === null) {
        rep.code(404); rep.send();
        console.log(`${red("X")} No task found! (id: ${fileData.task})`);
        return new Error("Task not found!");
    }
    
    /* Get common data */
    const date = new Date();
    const dateLong = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const dateShort = `${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`;

    /* Get data from file type */
    const fileType = taskToFileType[task.type];
    let fileName, filePath = "";
    // TODO: improve file names
    switch(fileType) {
        case DaemonFileType.BACKUP_DATABASE:
            console.log(`${green("^")} Created a new database backup! (database: ${bold(yellow(fileData.database))})!`);
            fileName = `db-${dateShort}`;
            filePath = path.join("databases", fileData.database, dateLong, `${dateShort}.sql`);
            break;

        case DaemonFileType.CONTAINER_LOG:
            console.log(`${green("^")} Created a new container log! (container: ${bold(yellow(fileData.container))})!`);
            fileName = `log-${dateShort}`;
            filePath = path.join("containers", fileData.container, dateLong, `${dateShort}.json`);
            break;
    }

    /* Process file */
    const fileResult = await processFileInternal(
        database,
        data,
        fileType,
        fileName,
        server.author,
        options.root,
        filePath
    );
    if(fileResult instanceof Error) {
        /* Set task as failed */
        console.log(`${red("X")} File save failed! (error: ${fileResult.message})`);
        database.edit({ destination: "tasks", item: { status: "FAILED" }, selectors: { id: fileData.task } });
        return fileResult;
    }

    /* Set task as done */
    database.edit({ destination: "tasks", item: { result: fileResult.id }, selectors: { id: fileData.task } });
    return null;
}

type UserFile = {
    id: string;
    author: string;
    type: DaemonFileType;
    name: string;
    size: number;
    path: string;
};
export async function processFileInternal(database: Database, data: MultipartFile, type: DaemonFileType, name: string, author: string, root: string, filePath: string): Promise<Error | UserFile> {
    const fullPath = path.join(root, filePath);
    const err = await new Promise<Error | null>((resolve) => {
        fs.mkdir(path.dirname(fullPath), { recursive: true }, async(e) => {
            if(e) {
                resolve(e);
                return;
            }

            await pump(data.file, fs.createWriteStream(fullPath));
            resolve(null);
        });
    });
    if(err !== null) {
        return err;
    }

    const userFile: UserFile = {
        id: randomBytes(16).toString("hex"),
        author: author,
        type: type,
        name: name,
        size: statSync(fullPath).size,
        path: filePath
    };
    database.add({ destination: "userfiles", item: userFile });

    return userFile;
}