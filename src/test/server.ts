import { setupServer } from "msw/node";
import { operatorHandlers } from "./handlers/operator";
import { appHandlers } from "./handlers/app";
import { evarHandlers } from "./handlers/evar";

export const server = setupServer(...operatorHandlers, ...appHandlers, ...evarHandlers);
