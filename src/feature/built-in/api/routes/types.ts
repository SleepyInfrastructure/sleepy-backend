import { BuiltinRouteType } from "./built-in";
import { CustomRouteType } from "./custom";

export type RouteOptions = {
    path: string;
    type: BuiltinRouteType | CustomRouteType;
};