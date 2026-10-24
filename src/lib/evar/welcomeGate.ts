/**
 * Whether a visitor to /evar has been through the welcome page yet.
 *
 * It lives in localStorage like the practice's other preferences, so it needs
 * no cookie, and it fails open: storage that throws counts as welcomed, since
 * a visitor sent back to the welcome page forever is far worse than one who
 * skips it.
 */

export const WELCOME_PATH = "/evar/welcome";

/** Set once the welcome page has been shown. */
export const WELCOMED_KEY = "evar-welcomed";

/** The old study popup's answer, which means someone has been asked already. */
const ANSWERED_KEY = "evar-study-asked";

/**
 * Whether this browser has seen the welcome page or answered the old popup.
 *
 * @param storage - localStorage, or anything with its getItem.
 * @returns True when welcomed, or when storage can't be read.
 */
export function hasBeenWelcomed(storage: Pick<Storage, "getItem">): boolean {
  try {
    return storage.getItem(WELCOMED_KEY) === "true" || storage.getItem(ANSWERED_KEY) === "true";
  } catch {
    return true;
  }
}

/**
 * Remembers that this browser has seen the welcome page.
 *
 * @param storage - localStorage, or anything with its setItem.
 */
export function markWelcomed(storage: Pick<Storage, "setItem">): void {
  try {
    storage.setItem(WELCOMED_KEY, "true");
  } catch {
    // Blocked storage just means the gate never fires for this browser.
  }
}

/**
 * Runs inline before the practice paints on a full page load, the way the
 * theme script does, so a first-time visitor never sees the practice flash
 * before the welcome page. Client navigations are WelcomeGate's job.
 */
export const WELCOME_GATE_SCRIPT = `(function(){try{var s=window.localStorage;if(s.getItem(${JSON.stringify(WELCOMED_KEY)})!=='true'&&s.getItem(${JSON.stringify(ANSWERED_KEY)})!=='true'){window.location.replace(${JSON.stringify(WELCOME_PATH)});}}catch(e){}})();`;
