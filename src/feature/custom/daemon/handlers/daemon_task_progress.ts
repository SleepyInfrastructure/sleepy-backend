/* Types */
import { Connection, Daemon, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonTaskProgressMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonTaskProgressMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_TASK_PROGRESS], schemas.WebsocketDaemonTaskProgressMessage);
    }

    async handleDaemon(connection: Connection, message: schemas.WebsocketDaemonTaskProgressMessageType, daemon: Daemon): Promise<void> {
        const task = await this.parent.database.fetch<Task>({ source: "tasks", selectors: { id: message.id, author: daemon.author } });
        if(task === null) {
            console.log(`${red("X")} No task found to progress! (id: ${message.id})`);
            return;
        }
        const timestamp = Math.round(Date.now() / 1000);
        task.status = message.status as TaskStatus ?? task.status;
        task.progress = message.progress ?? task.progress;
        task.end = task.status !== "RUNNING" ? timestamp : null;
        this.parent.database.edit({ destination: "tasks", item: { progress: task.progress, status: task.status, end: task.end }, selectors: { id: message.id, author: daemon.author }});

        for(const client of this.parent.getClientsForId(daemon.author)) {
            client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_TASK_REPLY, task });
        }
    }
}

export default DaemonTaskProgressMessageHandler;