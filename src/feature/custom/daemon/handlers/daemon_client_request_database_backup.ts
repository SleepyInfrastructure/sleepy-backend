/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
import { randomBytes } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientRequestDatabaseBackupMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientRequestDatabaseBackupMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_DATABASE_BACKUP], schemas.WebsocketDaemonClientRequestDatabaseBackupMessage);
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientRequestDatabaseBackupMessageType, client: Client): Promise<void> {
        const requestedDaemon = this.parent.getDaemonForClient(client, message.id);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to request database backup from! (id: ${message.id})`);
            return;
        }
        const serverDatabase = await this.parent.database.fetch<Database>({ source: "databases", selectors: { id: message.database, author: client.id } });
        if(serverDatabase === null) {
            console.log(`${red("X")} No database found to backup! (id: ${message.database})`);
            return;
        }
        const timestamp = Math.round(Date.now() / 1000);
        const task: Task = {
            id: randomBytes(16).toString("hex"),
            author: client.id,
            type: message.data ? TaskType.BACKUP_DATABASE : TaskType.BACKUP_DATABASE_SCHEMA,
            object: serverDatabase.id,
            start: timestamp,
            status: TaskStatus.RUNNING,
            progress: 0,
            end: null,
            result: null
        };
        this.parent.database.add({ destination: "tasks", item: task });

        connection.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_TASK_REPLY, task });
        requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_DATABASE_BACKUP, database: serverDatabase.id, task: task.id, data: message.data });
    }
}

export default DaemonClientRequestDatabaseBackupMessageHandler;