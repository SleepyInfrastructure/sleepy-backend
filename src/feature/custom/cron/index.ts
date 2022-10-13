/* Types */
import { Status } from "ts/backend/base";
import { DatabaseType } from "database/types";
import { CronInterval, FeatureCronOptions } from "./types";
/* Node Imports */
import * as cron from "node-cron";
import { bold, gray, green, yellow } from "nanocolors";
/* Local Imports */
import Feature from "feature";
import Instance from "instance";
import FeatureDaemon from "feature/custom/daemon";
import Database from "database";
import processUpdate from "./handlers/update";
import { processClean } from "./handlers/clean";

class FeatureCron extends Feature {
    options: FeatureCronOptions;

    constructor(parent: Instance, options: FeatureCronOptions) {
        super(parent, options);
        this.options = options;
    }

    async start(): Promise<void> {
        const database = this.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        const featureDaemon = this.parent.featureContainer.get("daemon") as FeatureDaemon;
        if (featureDaemon === undefined) {
            this.state = { status: Status.ERROR, message: "NO_FEATURE_DAEMON_FOUND" };
            return;
        }

        for(const interval of this.options.intervals) {
            cron.schedule(interval.time, () => {
                this.processInterval(featureDaemon, database, interval);
            });
        }
        console.log(`${green(">")} Registered ${yellow(bold(this.options.intervals.length))} cron-jobs!`);
    }

    processInterval(featureDaemon: FeatureDaemon, database: Database, interval: CronInterval) {
        if(interval.updates !== undefined) {
            for(const update of interval.updates) {
                console.log(`${gray("-")} Launching ${bold(yellow(update.type))} cron-job...`);
                processUpdate(featureDaemon, database, update);
            }
        }
        if(interval.cleans !== undefined) {
            for(const clean of interval.cleans) {
                processClean(database, clean);
            }
        }
    }
}

export default FeatureCron;
