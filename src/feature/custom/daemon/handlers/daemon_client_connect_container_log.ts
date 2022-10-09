/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
import { FeatureDaemonAddonType } from "../addons/addon";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";
import DaemonLogManager from "../addons/log";

class DaemonClientConnectContainerLogMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientConnectContainerLogMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_CONNECT_CONTAINER_LOG], schemas.WebsocketDaemonClientConnectContainerLogMessage);
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientConnectContainerLogMessageType, client: Client): Promise<void> {
        const addon = this.parent.addons.get(FeatureDaemonAddonType.DAEMON_LOG_MANAGER) as (DaemonLogManager | undefined);
        if(addon === undefined) {
            console.log(`${red("X")} Addon is not registered!`);
            return;
        }
        let container;
        if(message.project === true) {
            container = await this.parent.database.fetch<Container>({ source: "containerprojects", selectors: { id: message.id, author: client.id } });
        } else {
            container = await this.parent.database.fetch<ContainerProject>({ source: "containers", selectors: { id: message.id, author: client.id } });
        }
        if(container === null) {
            console.log(`${red("X")} No container found to connect logger to! (id: ${message.id}, project: ${message.project})`);
            return;
        }
        const requestedDaemon = this.parent.getDaemonForClient(client, container.server);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to connect container logger to! (server: ${container.server})`);
            return;
        }

        addon.connectClient(connection, client, requestedDaemon, container, { tail: 50, project: message.project });
    }
}

export default DaemonClientConnectContainerLogMessageHandler;