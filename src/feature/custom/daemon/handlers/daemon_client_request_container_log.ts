/* Types */
import { Client, Connection, DaemonWebsocketMessageType, TaskType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
import { randomBytes } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientRequestContainerLogMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientRequestContainerLogMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_CONTAINER_LOG], schemas.WebsocketDaemonClientRequestContainerLogMessage);
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientRequestContainerLogMessageType, client: Client): Promise<void> {
        const container = await this.parent.database.fetch({ source: "containers", selectors: { id: message.id, author: client.id } });
        if(container === undefined) {
            console.log(`${red("X")} No container found to request logs from! (id: ${message.id})`);
            return;
        }
        const requestedDaemon = this.parent.getDaemonForClient(client, container.server);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to request container logs from! (server: ${container.server})`);
            return;
        }
        const timestamp = Math.round(Date.now() / 1000);
        const task = {
            id: randomBytes(16).toString("hex"),
            author: client.id,
            type: TaskType.REQUEST_CONTAINER_LOG,
            object: message.id,
            start: timestamp
        };
        this.parent.database.add({ destination: "tasks", item: task });

        requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_CONTAINER_LOG, id: message.id, task: task.id });
    }
}

export default DaemonClientRequestContainerLogMessageHandler;