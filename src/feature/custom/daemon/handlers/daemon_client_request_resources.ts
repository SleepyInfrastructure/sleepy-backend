/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientRequestResourcesMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientRequestResourcesMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_REQUEST_RESOURCES], schemas.WebsocketDaemonClientRequestResourcesMessage);
    }

    handleClient(connection: Connection, message: schemas.WebsocketDaemonClientRequestResourcesMessageType, client: Client): void {
        const requestedDaemon = this.parent.getDaemonForClient(client, message.id);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to request resources from! (id: ${message.id})`);
            return;
        }

        requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_REQUEST_RESOURCES, resources: message.resources });
    }
}

export default DaemonClientRequestResourcesMessageHandler;