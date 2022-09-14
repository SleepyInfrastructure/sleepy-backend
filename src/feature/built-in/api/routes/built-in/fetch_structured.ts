/* Types */
import { APIStructure, APIStructureImported, APIStructureImportedDetails, Status } from "../../../../../ts/base";
import { RouteFetchStructuredOptions } from "./index";
import { FetchStructuredSchema, FetchStructuredSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import Database from "../../../../../database";
import { getSession, validateSchemaQuery } from "../util";

class RouteFetchStructured extends APIRoute {
    options: RouteFetchStructuredOptions;
    structure: APIStructureImported;
    details: APIStructureImportedDetails = { hasAuthorField: false };

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
        if(this.options.base.authorField !== undefined) {
           this.details.hasAuthorField = true; 
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
            if(value.authorField !== undefined) {
               this.details.hasAuthorField = true; 
            }
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

    hook(feature: FeatureAPI): void {
        feature.instance.get(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: RequestWithSchemaQuery<FetchStructuredSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(FetchStructuredSchema, req, rep)) {
                    return;
                }
                
                /* If needed fetch session */
                let session: any;
                if(this.options.base !== undefined && this.details.hasAuthorField) {
                    session = await getSession(feature.database, req, rep);
                    if(session === null) {
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
                            base = await feature.database.fetch({ source: this.options.base.table, selectors: selectors });
                            if (base === undefined) {
                                rep.code(404); rep.send();
                                return;
                            }
                            break;

                        case "ARRAY":
                            base = await feature.database.fetchMultiple({ source: this.options.base.table, selectors: selectors });
                            break;
                    }
                }
                
                /* Construct rest of the structure */
                if(Array.isArray(base)) {
                    const promises: Promise<any>[] = base.map(e => this.decorateBase(feature.database, req, session, e, this.structure));
                    base = await Promise.all(promises);
                } else {
                    base = await this.decorateBase(feature.database, req, session, base, this.structure);
                }

                rep.send(base);
            }
        );
    }

    async decorateBase(database: Database, req: RequestWithSchemaQuery<FetchStructuredSchemaType>, session: any, base: any, structure: APIStructureImported): Promise<any> {
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
