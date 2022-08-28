/* Base */
export enum DatabaseType {
    MYSQL = "MYSQL",
    REDIS = "REDIS",
}

export type DatabaseOptions = {
    id: string;
    name: string;
    type: DatabaseType;
};

export type DatabaseSelectorValue = string | number | DatabaseFetchSelector;
export type DatabaseItemValue = string | number | null;
export type DatabaseUnserializedItemValue = DatabaseItemValue | string[];

export type DatabaseFetchOptions = {
    source: string;
    selectors: Record<string, string | number | DatabaseFetchSelector>;
    ignoreSensitive?: boolean;
    sort?: DatabaseSort;
};

export type DatabaseFetchSelector = {
    value: string | number;
    comparison: ">" | ">=" | "<" | "<>" | "!=" | "<=" | "<=>" | "=";
};

export type DatabaseFetchMultipleOptions = DatabaseFetchOptions & {
    offset?: number;
    limit?: number;
};

export type DatabaseSort = {
    order?: "ASC" | "DESC";
    field: string;
};

export type DatabaseAddOptions = {
    destination: string;
    item: Record<string, DatabaseUnserializedItemValue>;
};

export type DatabaseEditOptions = {
    destination: string;
    selectors: Record<string, DatabaseSelectorValue>;
    item: Record<string, DatabaseUnserializedItemValue>;
};

export type DatabaseDeleteOptions = {
    source: string;
    selectors: Record<string, DatabaseSelectorValue>;
};

/* MySQL */
export enum DatabaseMySQLFieldModifier {
    ARRAY = "ARRAY"
}

export type DatabaseMySQLOptions = DatabaseOptions & {
    type: DatabaseType.MYSQL;

    host: string;
    port: number;
    user: string;
    password?: string;
    passwordEnv?: string;
    database: string;
    structure?: Record<string, Record<string, DatabaseMySQLStructureField>>;
};

export type DatabaseMySQLStructureField = {
    modifier?: DatabaseMySQLFieldModifier;
    sensitive?: boolean;
};
