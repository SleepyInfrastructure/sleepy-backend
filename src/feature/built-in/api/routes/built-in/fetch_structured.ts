/* Types */
import { APIStructure, APIStructureImported, Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteFetchStructuredOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import Database from "../../../../../database";

type Request = FastifyRequest<{
    Querystring: { id?: string };
}>;

const schema: FastifySchema = {
    querystring: {
        type: "object",
        required: [],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 }
        }
    }
};

class RouteFetchStructured extends APIRoute {
    options: RouteFetchStructuredOptions;
    structure: APIStructureImported;

    constructor(feature: FeatureAPI, options: RouteFetchStructuredOptions) {
        super(feature, options);
        this.options = options;
        this.structure = {};

        if(this.options.base === undefined) {
            this.state = { status: Status.ERROR, message: "NO_BASE_FOUND" };
            return;
        }
        if(this.options.base.structure === undefined) {
            this.state = { status: Status.ERROR, message: "NO_BASE_STRUCTURE_FOUND" };
            return;
        }
        const structureTemp = this.validateStructure(feature, this.options.base.structure);
        if(structureTemp === null) {
            return;
        }
        this.structure = structureTemp;
    }

    validateStructure(feature: FeatureAPI, structure: APIStructure | string): APIStructureImported | null {
        let apiStructure: APIStructure | null = null;
        if(typeof(structure) === "object") {
            apiStructure = structure;
        } else {
            const structureTemp = feature.parent.structureContainer.get(structure);
            if(structureTemp === undefined) {
                this.state = { status: Status.ERROR, message: `NO_STRUCTURE_FOUND - ${structure}` };
                return null;
            }
            apiStructure = structureTemp.structure;
        }
        
        for (const [key, value] of Object.entries(apiStructure)) {
            if(value.structure === undefined) {
                continue;
            }
            const childStructure = this.validateStructure(feature, value.structure);
            if(childStructure === null) {
                return null;
            }
            apiStructure[key].structure = childStructure;
        }

        return apiStructure as APIStructureImported;
    }

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }

        feature.instance.get(this.path,
            { schema: schema, config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: Request, rep) => {
                /* Predetermine if a session is needed, then fetch it once */
                let session: any;
                if((this.options.base !== undefined && this.options.base.authorField !== undefined) ||
                    Array.from(Object.values(this.structure)).some(e => e.authorField !== undefined)) {
                    if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }
                    session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                    if(session === undefined) {
                        rep.code(403); rep.send();
                        return;
                    }
                }

                /* Fetch base */
                let base: any = {};
                if(this.options.base !== undefined) {
                    /* Construct selectors */
                    let selectors: Record<string, string> = {};
                    if(this.options.base.disableIdField !== true) {
                        /* Validate schema */
                        if(req.query.id === undefined) { rep.code(400); rep.send(); return; }
                        selectors =  { [this.options.base.idField === undefined ? "id": this.options.base.idField]: req.query.id };
                    }
    
                    /* Add a selector if route needs an author */
                    if(this.options.base.authorField !== undefined) {
                        selectors[this.options.base.authorField] = session.user;
                    }
    
                    /* Fetch */
                    switch(this.options.base.type) {
                        case "SINGLE":
                            base = await database.fetch({ source: this.options.base.table, selectors: selectors });
                            if (base === undefined) {
                                rep.code(404); rep.send();
                                return;
                            }
                            break;

                        case "ARRAY":
                            base = await database.fetchMultiple({ source: this.options.base.table, selectors: selectors });
                            break;
                    }
                }
                
                /* Construct rest of the structure */
                if(Array.isArray(base)) {
                    const promises: Promise<any>[] = base.map(e => this.decorateBase(database, req, session, e, this.structure));
                    base = await Promise.all(promises);
                } else {
                    base = await this.decorateBase(database, req, session, base, this.structure);
                }

                rep.send(base);
            }
        );
    }

    async decorateBase(database: Database, req: Request, session: any, base: any, structure: APIStructureImported): Promise<any> {
        const decoratorPromises: Promise<{ key: string, value: any }>[] = [];
        for (const [key, value] of Object.entries(structure)) {
            decoratorPromises.push(new Promise(async(resolve, reject) => {
                /* Construct selectors */
                const selectors = value.disableIdField ? {} : { [value.idField === undefined ? "id": value.idField]: value.baseIdField === undefined ? req.query.id : base[value.baseIdField] };

                /* Add a selector if route needs an author */
                if(value.authorField !== undefined) {
                    selectors[value.authorField] = session.user;
                }

                /* Fetch */
                let decorator: any = {};
                switch(value.type) {
                    case "SINGLE":
                        const item = await database.fetch({ source: value.table, selectors: selectors });
                        decorator = { key, value: item };
                        break;

                    case "ARRAY":
                        const items = await database.fetchMultiple({ source: value.table, selectors: selectors, sort: value.sort, limit: value.limit });
                        decorator = { key, value: items };
                        break;
                }
                
                /* Construct rest of the structure */
                if(value.structure !== undefined) {
                    const decoratorStructure = value.structure;
                    if(Array.isArray(decorator.value)) {
                        const promises: Promise<any>[] = decorator.value.map((e: any) => this.decorateBase(database, req, session, e, decoratorStructure));
                        decorator.value = await Promise.all(promises);
                    } else {
                        decorator.value = await this.decorateBase(database, req, session, base, decoratorStructure);
                    }
                }

                resolve(decorator);
            }));
        }
        const decorators = await Promise.all(decoratorPromises);
        for(const decorator of decorators) {
            base[decorator.key] = decorator.value;
        }

        return base;
    }
}

export default RouteFetchStructured;
