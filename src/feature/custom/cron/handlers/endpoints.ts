/* Node Imports */
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { randomBytes } from "crypto";
import ping from "pingman";
import { lookup } from "dns";
/* Local Imports */
import Database from "database";

export async function processEndpointUptime(database: Database, endpoint: UptimeEndpoint) {
    let pingTime: number | null = null;
    if(endpoint.host !== null) {
        pingTime = await new Promise((resolve) => {
            if(endpoint.host === null) { return; }
            lookup(endpoint.host, async(e, address) => {
                if(e !== null) {
                    console.error(e);
                    resolve(null);
                    return;
                }
                try {
                    const res = await ping(address, { numberOfEchos: 1 });
                    resolve(res.alive === true && res.avg !== undefined ? res.avg : -1);
                } catch(e) {
                    console.error(e);
                    resolve(null);
                }
            });
        });
    }

    let requestTime: number | null = null;
    if(endpoint.requestEndpoint !== null) {
        requestTime = await new Promise((resolve) => {
            if(endpoint.requestEndpoint === null) { return; }
            const requestStart = Date.now();
            if(endpoint.requestEndpoint.startsWith("https://")) {
                const req = httpsRequest(endpoint.requestEndpoint, () => {
                    resolve(Date.now() - requestStart);
                    req.destroy();
                });
                req.on("error", () =>{
                    resolve(null);
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
                    resolve(null);
                    req.destroy();
                });
                req.write("");
                req.end();
            } else {
                resolve(null);
            }
        });
    }

    processEndpointUptimeResult(database, endpoint, pingTime, requestTime);
}

export function processEndpointUptimeResult(database: Database, endpoint: UptimeEndpoint, pingTime: number | null, requestTime: number | null) {
    const statistic: UptimeEndpointStatistic = {
        id: randomBytes(16).toString("hex"),
        author: endpoint.author,
        parent: endpoint.id,
        timestamp: Math.round(Date.now() / 1000),
        pingTime: pingTime,
        requestTime: requestTime
    };
    database.add({
        destination: "uptimestatistics",
        item: statistic
    });
}