/* Types */
import { Connection, DaemonWebsocketMessageType } from "../types";
import { FeatureDaemonAddonType } from "../addons/addon";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";
import DaemonLogManager from "../addons/log";

class DaemonContainerLogMessageMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonContainerLogMessageMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CONTAINER_LOG_MESSAGE], schemas.WebsocketDaemonContainerLogMessageMessage);
    }

    handleDaemon(connection: Connection, message: schemas.WebsocketDaemonContainerLogMessageMessageType): void {
        const addon = this.parent.addons.get(FeatureDaemonAddonType.DAEMON_LOG_MANAGER) as (DaemonLogManager | undefined);
        if(addon === undefined) {
            console.log(`${red("X")} Addon is not registered!`);
            return;
        }
        const item = addon.containers.get(message.id);
        if(item === undefined) {
            // console.log(`${red("X")} No container found with connected logger! (${detailedMessage.container})`);
            return;
        }
        
        for(const client of item.users) {
            client.send({ type: DaemonWebsocketMessageType.DAEMON_CLIENT_CONTAINER_LOG_MESSAGE, id: message.id, message: message.message });
        }
    }
}

export default DaemonContainerLogMessageMessageHandler;