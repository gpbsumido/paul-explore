import { setupServer } from "msw/node";
import { operatorHandlers } from "./handlers/operator";

export const server = setupServer(...operatorHandlers);
