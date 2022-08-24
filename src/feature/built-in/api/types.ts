/* Types */
import { FeatureServerOptions, FeatureType } from "../../../ts/base";
import { RouteOptions } from "./routes/types";

/* Options */
export type FeatureAPIOptions = FeatureServerOptions & {
    type: FeatureType.API;

    routes: RouteOptions[];
};
