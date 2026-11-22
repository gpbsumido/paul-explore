/**
 * Puts text on the clipboard and says whether it got there. The browser can
 * refuse (no permission, an insecure origin) or have no clipboard API at all,
 * and a copy button has to know which so it doesn't claim a copy that never
 * happened.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
