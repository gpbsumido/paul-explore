import { setupServer } from "msw/node";
import { operatorHandlers } from "./handlers/operator";
import { appHandlers } from "./handlers/app";

export const server = setupServer(...operatorHandlers, ...appHandlers);
