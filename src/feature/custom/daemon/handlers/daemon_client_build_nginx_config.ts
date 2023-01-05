/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
import { readFileSync } from "fs";
import { createHash } from "crypto";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientBuildNginxConfigMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientBuildNginxConfigMessageType> {
    dockerfile: string;
    nginxConfig: string;

    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_BUILD_NGINX_CONFIG], schemas.WebsocketDaemonClientBuildNginxConfigMessage);
        this.dockerfile = readFileSync("config/data/nginx/Dockerfile", "utf-8");
        this.nginxConfig = readFileSync("config/data/nginx/nginx.conf", "utf-8");
    }

    createServerHash(server: NginxServer, location: NginxLocation) {
        return createHash("md5").update(`${server.id}-${location.id}`).digest("hex");
    }

    createWebsocketUpgrade() {
        return [
            "map $http_upgrade $connection_upgrade {",
            "    default Upgrade;",
            "    ''      close;",
            "}"
        ];
    }

    createUpstream(server: NginxServer, location: NginxLocation) {
        return [
            `upstream ${this.createServerHash(server, location)} {`,
            `    server ${location.endpoint};`,
            "}"
        ];
    }

    createHttpRedirect(server: NginxServer) {
        return [
            "server {",
            `    listen ${server.http2 ? "80 http2" : "80"};`,
            `    server_name ${server.domain};`,
            "    location / {",
            `        return 301 https://${server.domain};`,
            "    }",
            "}"
        ];
    }

    createLocation(server: NginxServer, location: NginxLocation) {
        const l = [
            `    location /${location.path} {`,
            `        expires ${location.type === "STATIC" ? `$return_expires_${server.id}` : "off"};`,
            `        add_header Access-Control-Allow-Origin $return_origin_${server.id};`,
            "        add_header Access-Control-Allow-Credentials true;"
        ];
        if(location.type === "WS") {
            l.push(...[
                "        proxy_set_header Upgrade $http_upgrade;",
                '        proxy_set_header Connection "Upgrade";',
                "        proxy_http_version 1.1;"
            ]);
        }
        l.push(...[
            "        proxy_set_header Host $http_host;",
            `        proxy_pass https://${this.createServerHash(server, location)};`,
            "    }"
        ]);
        
        return l;
    }

    createServer(server: NginxServer, locations: NginxLocation[]) {
        return [
            "server {",
            `    listen 443 ${server.http2 ? "ssl http2" : "ssl"};`,
            `    server_name ${server.domain};`,
            `    ssl_certificate /etc/letsencrypt/live/${server.ssl}/fullchain.pem;`,
            `    ssl_certificate_key /etc/letsencrypt/live/${server.ssl}/privkey.pem;`,
            ...locations.map(location => this.createLocation(server, location)).flat(),
            "}"
        ];
    }

    createReturnExpires(server: NginxServer) {
        return [
            `    map $sent_http_content_type $return_expires_${server.id} {`,
            "        default 7d;",
            "    }"
        ];
    }

    createReturnOrigin(server: NginxServer) {
        return [
            `    map $http_origin $return_origin_${server.id} {`,
            `        default "https://${server.domain}";`,
            ...server.origins.map(origin => `        ${origin} "${origin}";`).flat(),
            "    }"
        ];
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientRequestResourcesMessageType, client: Client): Promise<void> {
        const requestedDaemon = this.parent.getDaemonForClient(client, message.id);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to build NGINX config on! (id: ${message.id})`);
            return;
        }

        const instances = await this.parent.database.fetchMultiple<NginxInstance>({ source: "nginxinstances", selectors: { server: message.id, author: client.id } });
        const instanceConfig: string[] = [];
        const instanceNetworks = [];
        const serverConfigs: { name: string, domain: string, ssl: string, config: string }[] = [];
        let nginxConfig: string = this.nginxConfig;
        const nginxMap: string[] = [];

        // Create docker-compose.yml
        instanceConfig.push('version: "3"');
        instanceConfig.push("services:");
        for(const instance of instances) {
            // Fill in instance service
            instanceConfig.push(`  sleepy-nginx-${instance.name}:`);
            instanceConfig.push(`    container_name: sleepy-nginx-${instance.name}`);
            instanceConfig.push("    restart: always");
            instanceConfig.push(`    image: sleepy-nginx-${instance.name}:latest`);

            // Fill in volumes
            instanceConfig.push("    volumes:");
            const volumes = [
                "./nginx.conf:/etc/nginx/nginx.conf",
                "./conf.d:/etc/nginx/conf.d"
            ];
            for(const volume of volumes) {
                instanceConfig.push(`      - ${volume}`);
            }

            // Fill in networks
            instanceConfig.push("    networks:");
            instanceNetworks.push(...instance.networks);
            for(const network of instance.networks) {
                instanceConfig.push(`      - ${network}`);
            }

            // Fill in ports
            instanceConfig.push("    ports:");
            instanceConfig.push("      - 80:80");
            instanceConfig.push("      - 443:443");

            // Fill build details
            instanceConfig.push("    build:");
            instanceConfig.push("      context: ./");

            // Construct conf.d configs
            const servers = await this.parent.database.fetchMultiple<NginxServer>({ source: "nginxservers", selectors: { parent: instance.id, author: client.id } });
            for(const server of servers) {
                // Create config for server
                const locations = await this.parent.database.fetchMultiple<NginxLocation>({ source: "nginxlocations", selectors: { parent: server.id, author: client.id } });
                const serverConfig: string[] = [];
                if(locations.some(e => e.type === "WS")) {
                    serverConfig.push(...this.createWebsocketUpgrade());
                    serverConfig.push("");
                }
                for(const location of locations) {
                    serverConfig.push(...this.createUpstream(server, location));
                    serverConfig.push("");
                }
                if(server.httpRedirect) {
                    serverConfig.push(...this.createHttpRedirect(server));
                    serverConfig.push("");
                }
                serverConfig.push(...this.createServer(server, locations));
                serverConfigs.push({
                    name: server.name,
                    domain: server.domain,
                    ssl: server.ssl,
                    config: serverConfig.join("\n")
                });
        
                // Fill in required maps for nginx.conf
                nginxMap.push(...this.createReturnExpires(server));
                nginxMap.push("");
                nginxMap.push(...this.createReturnOrigin(server));
            }
        }
        instanceConfig.push("networks:");
        for(const network of instanceNetworks) {
            instanceConfig.push(`  ${network}:`);
            instanceConfig.push(`    name: ${network}`);
            instanceConfig.push("    external: true");
        }

        nginxConfig = nginxConfig.replace("%CUSTOM_MAP%", nginxMap.join("\n"));
        nginxConfig = nginxConfig.replace("%TIME%", new Date().toUTCString());

        requestedDaemon.send({
            type: DaemonWebsocketMessageType.DAEMON_BUILD_NGINX_CONFIG,
            config: instanceConfig.join("\n"),
            dockerfile: this.dockerfile,
            nginxConfig: nginxConfig,
            servers: serverConfigs,
            networks: instanceNetworks
        });
    }
}

export default DaemonClientBuildNginxConfigMessageHandler;