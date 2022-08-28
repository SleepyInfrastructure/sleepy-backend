/* Types */
import { Status } from "../../../ts/base";
import { DatabaseAddOptions, DatabaseDeleteOptions, DatabaseEditOptions, DatabaseFetchMultipleOptions, DatabaseFetchOptions, DatabaseFetchSelector, DatabaseItemValue, DatabaseMySQLFieldModifier, DatabaseMySQLOptions, DatabaseSelectorValue, DatabaseUnserializedItemValue } from "../../types";

/* Node Imports */
import { createConnection, Connection, FieldPacket } from "mysql2/promise";

/* Local Imports */
import Database from "../..";
import Instance from "../../../instance";

class DatabaseMySQL extends Database {
    options: DatabaseMySQLOptions;
    connection: void | Connection | undefined;

    constructor(parent: Instance, options: DatabaseMySQLOptions) {
        super(parent, options);
        this.options = options;
    }

    async start(): Promise<void> {
        let password;
        if(this.options.password !== undefined) {
            password = this.options.password;
        } else if(this.options.passwordEnv !== undefined) {
            password = process.env[this.options.passwordEnv];
        } else {
            this.state = { status: Status.ERROR, message: "NO_PASSWORD" };
            return;
        }

        this.connection = await createConnection({
            host: this.options.host,
            user: this.options.user,
            password: password,
            database: this.options.database,
            charset: "utf8mb4",
        }).catch((e) => {
            this.state = { status: Status.ERROR, message: e.message };
        });
        setInterval(() => { this.fetch({ source: "users", selectors: { id: "0" } }); }, 1000 * 60 * 5);
    }

    async fetch(options: DatabaseFetchOptions): Promise<any> {
        try {
            if (this.connection === undefined) {
                return;
            }
            let query = `SELECT * FROM \`${options.source}\` ${this.selectorsToSyntax(options.selectors)} LIMIT 1`;
            if(options.sort !== undefined) {
                query += ` ORDER BY ${options.sort.field} ${options.sort.order ?? "ASC"}`;
            }

            const items: [any, FieldPacket[]] = await this.connection.execute(query, this.selectorsToData(options.selectors));
            return this.deserialize(options, items[0][0]);
        } catch(e) {
            console.error("Error trying to fetch an item:");
            console.error(e);
            console.error(options);
            throw e;
        }
    }

    async fetchMultiple(options: DatabaseFetchMultipleOptions): Promise<any[]> {
        try {
            if (this.connection === undefined) {
                return [];
            }
            let query = `SELECT * FROM \`${options.source}\` ${this.selectorsToSyntax(options.selectors)}`;
            if(options.sort !== undefined) {
                query += ` ORDER BY ${options.sort.field} ${options.sort.order}`;
            }
            if(options.limit !== undefined) {
                query += ` LIMIT ${options.limit}`;
            }
            if(options.offset !== undefined) {
                query += ` OFFSET ${options.offset}`;
            }

            const items: [any, FieldPacket[]] = await this.connection.execute(query, this.selectorsToData(options.selectors));
            return items[0].map((item: any) => this.deserialize(options, item));
        } catch(e) {
            console.error("Error trying to fetch items:");
            console.error(e);
            console.error(options);
            throw e;
        }
    }

    async add(options: DatabaseAddOptions): Promise<void> {
        try {
            if (this.connection === undefined) {
                return;
            }
            const item = this.serialize(options.destination, options.item);
            const values = this.itemToValues(item);
            await this.connection.execute(`INSERT INTO \`${options.destination}\` (${this.itemToKeys(item)}) VALUES (${this.itemToValuesWithQuestions(item)})`, values);
        } catch(e) {
            console.error("Error trying to add an item:");
            console.error(e);
            console.error(options);
            throw e;
        }
    }

    async edit(options: DatabaseEditOptions): Promise<void> {
        try {
            if (this.connection === undefined) {
                return;
            }
            const item = this.serialize(options.destination, options.item);
            const values = this.itemToValues(item).concat(this.selectorsToData(options.selectors));
            await this.connection.execute(`UPDATE \`${options.destination}\` SET ${this.itemToKeysWithQuestions(item)} ${this.selectorsToSyntax(options.selectors)}`, values);
        } catch(e) {
            console.error("Error trying to edit an item:");
            console.error(e);
            console.error(options);
            throw e;
        }
    }

    async delete(options: DatabaseDeleteOptions): Promise<number> {
        try {
            if (this.connection === undefined) {
                return -1;
            }
            const values = this.selectorsToData(options.selectors);
            const items: [any, FieldPacket[]] = await this.connection.execute(`DELETE FROM \`${options.source}\` ${this.selectorsToSyntax(options.selectors)}`, values);
            return items[0].affectedRows;
        } catch(e) {
            console.error("Error trying to delete an item:");
            console.error(e);
            console.error(options);
            throw e;
        }
    }

    selectorsToSyntax(selectors: Record<string, DatabaseSelectorValue>): string {
        const list = Object.keys(selectors);
        if (list.length > 0) {
            return `WHERE ${list.map((e) => `\`${e}\` ${(typeof(selectors[e]) !== "object" ? "=" : (selectors[e] as DatabaseFetchSelector).comparison)} ?`).join(" AND ")}`;
        }

        return "";
    }

    selectorsToData(selectors: Record<string, DatabaseSelectorValue>): string[] {
        return Object.values(selectors).map(e => typeof(e) !== "object" ? e.toString() : e.value.toString());
    }

    itemToKeys(item: Record<string, DatabaseItemValue>): string {
        return Object.keys(item).map(e => `\`${e}\``).join(", ");
    }

    itemToKeysWithQuestions(item: Record<string, DatabaseItemValue>): string {
        return Object.keys(item).map(e => `\`${e}\` = ?`).join(", ");
    }

    itemToValues(item: Record<string, DatabaseItemValue>): (string | null)[] {
        return Object.values(item).map(e => e === null ? e : e.toString());
    }

    itemToValuesWithQuestions(item: Record<string, DatabaseItemValue>): string {
        return Object.values(item).map(() => "?").join(", ");
    }

    deserialize(options: DatabaseFetchOptions, item: any): Record<string, DatabaseUnserializedItemValue> {
        if(item === undefined) {
            return item;
        }

        const newItem: any = item;
        if(this.options.structure !== undefined && this.options.structure[options.source] !== undefined) {
            for(const field of Object.keys(this.options.structure[options.source])) {
                /* Apply modifiers */
                const fieldOptions = this.options.structure[options.source][field];
                switch(fieldOptions.modifier) {
                    case DatabaseMySQLFieldModifier.ARRAY:
                        newItem[field] = newItem[field].split(",").filter((e: string) => e !== "");
                        break;
                }

                /* Apply other options */
                if(options.ignoreSensitive !== true && fieldOptions.sensitive === true) {
                    delete newItem[field];
                }
            }
        }

        return newItem;
    }

    serialize(table: string, item: Record<string, DatabaseUnserializedItemValue>): Record<string, DatabaseItemValue> {
        const newItem: any = item;
        if(this.options.structure !== undefined && this.options.structure[table] !== undefined) {
            const fields = Object.keys(this.options.structure[table]).filter(e => newItem[e] !== undefined);
            for(const field of fields) {
                /* Apply modifiers */
                const fieldOptions = this.options.structure[table][field];
                switch(fieldOptions.modifier) {
                    case DatabaseMySQLFieldModifier.ARRAY:
                        const fieldArray = newItem[field] as string[];
                        newItem[field] = fieldArray.join(",");
                        break;
                }
            }
        }

        return newItem;
    }

}

export default DatabaseMySQL;
