/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonsMessageHandler extends WebsocketMessageHandler<schemas.WebsocketMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMONS], schemas.WebsocketMessage);
    }

    handleClient(connection: Connection, message: schemas.WebsocketMessageType, client: Client): void {
        connection.send({
            type: DaemonWebsocketMessageType.DAEMONS_REPLY,
            items: this.parent.getDaemonListForAuthor(client.id)
        });
    }
}

export default DaemonsMessageHandler;