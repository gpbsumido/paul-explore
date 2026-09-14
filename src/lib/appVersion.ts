import { version } from "../../package.json";

/** The app's package version, resolved at build time. Server-side source of
 *  truth for anything that surfaces the running build (mirrors the import
 *  WebVitalsReporter already uses for the vitals beacon). */
export const APP_VERSION: string = version;
