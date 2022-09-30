/* Types */
import Database from "../../../../database";

/* Node Imports */
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { randomBytes } from "crypto";
import ping from "pingman";
import { lookup } from "dns";

export async function processEndpointUptime(database: Database, endpoint: any) {
    let pingTime: number | null = null;
    if(endpoint.host !== null) {
        pingTime = await new Promise((resolve) => {
            lookup(endpoint.host, async(e, address) => {
                if(e !== null) {
                    console.error(e);
                    resolve(-1);
                    return;
                }
                try {
                    const res = await ping(address, { numberOfEchos: 1 });
                    resolve(res.alive === true && res.avg !== undefined ? res.avg : -1);
                } catch(e) {
                    console.error(e);
                    resolve(-1);
                }
            });
        });
    }

    let requestTime: number | null = null;
    if(endpoint.requestEndpoint !== null) {
        requestTime = await new Promise((resolve) => {
            const requestStart = Date.now();
            if(endpoint.requestEndpoint.startsWith("https://")) {
                const req = httpsRequest(endpoint.requestEndpoint, () => {
                    resolve(Date.now() - requestStart);
                    req.destroy();
                });
                req.on("error", () =>{
                    resolve(-1);
                    req.destroy();
                });
                req.write("");
                req.end();
            } else if(endpoint.requestEndpoint.startsWith("http://")) {
                const req = httpRequest(endpoint.requestEndpoint, () => {
                    resolve(Date.now() - requestStart);
                    req.destroy();
                });
                req.on("error", () => {
                    resolve(-1);
                    req.destroy();
                });
                req.write("");
                req.end();
            } else {
                resolve(-1);
            }
        });
    }

    processEndpointUptimeResult(database, endpoint, pingTime, requestTime);
}

export function processEndpointUptimeResult(database: Database, endpoint: any, pingTime: number | null, requestTime: number | null) {
    database.add({
        destination: "uptimestatistics",
        item: {
            id: randomBytes(16).toString("hex"),
            author: endpoint.author,
            parent: endpoint.id,
            timestamp: Math.round(Date.now() / 1000),
            pingTime: pingTime,
            requestTime: requestTime
        }
    });
}