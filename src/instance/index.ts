/* Types */
import { DatabaseType, FeatureType, InstanceOptions, StateDescriptor, Status } from "../ts/base";

/* Node Imports */
import { workerData } from "worker_threads";
import { bold, green, red, yellow, gray } from "nanocolors";
import { readFileSync } from "fs";

/* Local Imports */
import Feature from "../feature";
import FeatureStatic from "../feature/built-in/static";
import FeatureAPI from "../feature/built-in/api";
import FeatureDaemon from "../feature/custom/daemon";
import FeatureDaemonCron from "../feature/custom/daemon-cron";
import Database from "../database";
import DatabaseMySQL from "../database/addons/mysql";

class Instance {
    id: string;
    state: StateDescriptor;
    options: InstanceOptions;

    databaseContainer: Map<string, Database>;
    featureContainer: Map<string, Feature>;

    constructor(id: string) {
        this.id = id;
        this.state = { status: Status.WAITING, message: "WAITING" };
        this.options = JSON.parse(readFileSync(`configs/instances/${id}/options.json`, "utf-8"));

        this.databaseContainer = new Map();
        this.featureContainer = new Map();
    }

    load(): void {
        for (const id of this.options.databases) {
            const options = JSON.parse(readFileSync(`configs/databases/${id}/options.json`, "utf-8"));
            let database: Database | undefined;
            switch (options.type) {
                case DatabaseType.MYSQL:
                    database = new DatabaseMySQL(this, options);
                    break;
            }

            if (database === undefined) {
                continue;
            }
            this.databaseContainer.set(database.id, database);
        }

        for (const id of this.options.features) {
            const options = JSON.parse(readFileSync(`configs/features/${id}/options.json`, "utf-8"));
            let feature: Feature | undefined;
            switch (options.type) {
                case FeatureType.STATIC:
                    feature = new FeatureStatic(this, options);
                    break;

                case FeatureType.API:
                    feature = new FeatureAPI(this, options);
                    break;

                case FeatureType.DAEMON:
                    feature = new FeatureDaemon(this, options);
                    break;

                case FeatureType.DAEMON_CRON:
                    feature = new FeatureDaemonCron(this, options);
                    break;
            }

            if (feature === undefined) {
                continue;
            }
            this.featureContainer.set(feature.id, feature);
        }
    }

    async start(): Promise<void> {
        console.log(`[  ${gray("WAITING")}  ] Instance ${bold(yellow(this.options.name))} starting...`);

        for (const database of Array.from(this.databaseContainer.values())) {
            await database.start();
            if (database.state.status === Status.WAITING) {
                console.log(`${green(">")} Database ${bold(yellow(database.name))} started!`);
            } else {
                console.log(`${red(">")} Database ${bold(yellow(database.name))} failed to start! (ERROR: ${red(database.state.message)})`);
                this.fail(database.state);
                return;
            }

            database.state = { status: Status.SUCCESS, message: "SUCCESS" };
        }

        for (const feature of Array.from(this.featureContainer.values())) {
            await feature.start();
            if (feature.state.status === Status.WAITING) {
                console.log(`${green(">")} Feature ${bold(yellow(feature.name))} started!`);
            } else {
                console.log(`${red(">")} Feature ${bold(yellow(feature.name))} failed to start! (ERROR: ${red(feature.state.message)})`);
                this.fail(feature.state);
                return;
            }

            feature.state = { status: Status.SUCCESS, message: "SUCCESS" };
        }

        this.state = { status: Status.SUCCESS, message: "SUCCESS" };
        console.log(`[  ${green("OK")}  ] Instance ${bold(yellow(this.options.name))} started!`);
    }

    fail(errorStatus: StateDescriptor): void {
        this.state = { status: Status.ERROR, message: errorStatus.message };
        console.log(`[  ${red("ERROR")}  ] Instance ${bold(yellow(this.options.name))} failed to start!`);
    }

    getDatabase(type: DatabaseType): Database | undefined {
        return Array.from(this.databaseContainer.values()).find((e) => e.type === type);
    }
}

export default Instance;

const instance = new Instance(workerData.id);
instance.load();
instance.start();
