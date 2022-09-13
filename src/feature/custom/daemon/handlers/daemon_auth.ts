/* Types */
import { Connection, Daemon, DaemonWebsocketAuthFailure, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { bold, green, red, yellow } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonAuthMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonAuthMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_AUTH], schemas.WebsocketDaemonAuthMessage);
    }

    async handle(connection: Connection, message: schemas.WebsocketDaemonAuthMessageType): Promise<void> {
        if(connection.daemon !== null) {
            console.log(`${red("X")} Daemon already authenticated!`);
            return;
        }
        if(message.version !== this.parent.options.version) {
            console.log(`${red("X")} Socket failed to promote to daemon! (daemon version ${bold(red(message.version))} is not ${bold(green(this.parent.options.version))})`);
            connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.VERSION_MISMATCH, version: this.parent.options.version });
            return;
        }

        const daemonToken = await this.parent.database.fetch({ source: "daemontokens", selectors: { id: message.token } });
        if(daemonToken === undefined) {
            console.log(`${red("X")} Socket failed to promote to daemon!`);
            connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        const server = await this.parent.database.fetch({ source: "servers", selectors: { id: daemonToken.server } });
        if(server === undefined) {
            console.log(`${red("X")} Socket failed to promote to daemon! (server: ${bold(yellow(daemonToken.server))})`);
            connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        console.log(`${yellow("^")} Socket promoted to daemon! (server: ${bold(yellow(daemonToken.server))})`);
        this.parent.database.edit({ destination: "daemontokens", selectors: { id: daemonToken.id }, item: { used: Math.round(Date.now() / 1000) } });
        await this.parent.database.edit({ destination: "databases", selectors: { server: daemonToken.server }, item: { credentials: 0 } });
        for(const id of message.databases) {
            this.parent.database.edit({ destination: "databases", selectors: { id, server: daemonToken.server }, item: { credentials: 1 } });
        }

        connection.daemon = new Daemon(server.id, server.author);
        connection.send({ type: DaemonWebsocketMessageType.DAEMON_AUTH_SUCCESS, id: server.id, name: server.name });
        for(const client of this.parent.getClientsForId(connection.daemon.author)) {
            client.send({
                type: DaemonWebsocketMessageType.DAEMONS_REPLY,
                items: this.parent.getDaemonListForAuthor(connection.daemon.author)
            });
        }
    }
}

export default DaemonAuthMessageHandler;