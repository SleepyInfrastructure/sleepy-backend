/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientRequestContainerActionMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientContainerActionMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_CONTAINER_ACTION], schemas.WebsocketDaemonClientContainerActionMessage);
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientContainerActionMessageType, client: Client): Promise<void> {
        let container;
        if(message.project === true) {
            container = await this.parent.database.fetch<Container>({ source: "containerprojects", selectors: { id: message.id, author: client.id } });
        } else {
            container = await this.parent.database.fetch<ContainerProject>({ source: "containers", selectors: { id: message.id, author: client.id } });
        }
        if(container === null) {
            console.log(`${red("X")} No container found to request logs from! (id: ${message.id})`);
            return;
        }
        const requestedDaemon = this.parent.getDaemonForClient(client, container.server);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to request container action from! (server: ${container.server})`);
            return;
        }
        requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_CONTAINER_ACTION, id: message.id, action: message.action });
    }
}

export default DaemonClientRequestContainerActionMessageHandler;