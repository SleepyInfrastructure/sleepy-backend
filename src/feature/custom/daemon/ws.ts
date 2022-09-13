/* Types */ 
import FeatureDaemon from ".";
import { Client, Connection, DaemonWebsocketAuthFailure, DaemonWebsocketMessageType } from "./types";
import Database from "../../../database";
/* Node Imports */
import { bold, gray, green, red, yellow } from "nanocolors";
import { FastifyRequest } from "fastify";
/* Local Imports */
import { validate } from "./util";
import * as schemas from "./schemas";
import messageHandlers from "./handlers";
import WebsocketMessageHandler from "./handlers/message";

export async function handleWebsocket(feature: FeatureDaemon, database: Database, connection: Connection, request: FastifyRequest) {
    console.log(`${green(">")} Socket connected!`);
    if(request.cookies.Token !== undefined) {
        const session = await database.fetch({ source: "sessions", selectors: { "id": request.cookies.Token } });
        if(session === undefined) {
            console.log(`${red("X")} Socket failed to promote to client!`);
            connection.send({ type: DaemonWebsocketMessageType.AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        const user = await database.fetch({ source: "users", selectors: { "id": session.user } });
        if(user === undefined) {
            console.log(`${red("X")} Socket failed to promote to client! (user: ${bold(yellow(session.user))})`);
            connection.send({ type: DaemonWebsocketMessageType.AUTH_FAILURE, reason: DaemonWebsocketAuthFailure.WRONG_TOKEN });
            return;
        }
        console.log(`${yellow("^")} Socket promoted to client! (user: ${bold(yellow(user.id))})`);
        connection.client = new Client(user.id);
        connection.send({ type: DaemonWebsocketMessageType.AUTH_SUCCESS, id: user.id, username: user.username });
    }

    const handlers: Map<DaemonWebsocketMessageType, WebsocketMessageHandler<any>> = new Map();
    for(const MessageHandler of messageHandlers) {
        const handler = new MessageHandler(feature);
        for(const type of handler.types) {
            handlers.set(type, handler);
        }
    }
    
    const hideMessageTypes: string[] = [DaemonWebsocketMessageType.DAEMON_CONTAINER_LOG_MESSAGE];
    connection.stream.socket.on("message", async(messageRaw) => {
        const messageRawText = messageRaw.toString();
        let messageRawJson: any;
        try {
            messageRawJson = JSON.parse(messageRawText);
        } catch(e) {
            console.log(`${red("X")} Message failed parsing! (${e})`);
            return;
        }
        const message = validate<schemas.WebsocketMessageType>(schemas.WebsocketMessage, messageRawJson);
        if(message === null) {
            return;
        }
        if(!hideMessageTypes.includes(message.type)) {
            console.log(`${gray("-")} Got message of type ${bold(yellow(message.type))}.`);
        }

        const handler = handlers.get(message.type);
        if(handler === undefined) {
            return;
        }
        const detailedMessage = handler.validate(messageRawJson);
        if(detailedMessage === null) {
            return;
        }
        if(handler.handle !== undefined) {
            handler.handle(connection, detailedMessage);
        }
        if(connection.client !== null && handler.handleClient !== undefined) {
            handler.handleClient(connection, detailedMessage, connection.client);
        }
        if(connection.daemon !== null && handler.handleDaemon !== undefined) {
            handler.handleDaemon(connection, detailedMessage, connection.daemon);
        }
    });
    connection.stream.socket.on("close", () => {
        feature.disconnect(connection);
        if(connection.daemon !== null) {
            console.log(`${red("<")} Daemon disconnected! (server: ${bold(yellow(connection.daemon.id))})`);
            return;
        }
        if(connection.client !== null) {
            console.log(`${red("<")} Client disconnected! (user: ${bold(yellow(connection.client.id))})`);
            return;
        }
        console.log(`${red("<")} Socket disconnected!`);
    });
}