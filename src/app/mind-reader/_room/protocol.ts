import { z } from "zod";

/**
 * The wire for a Mind Reader room. Player A's device runs the game and sends
 * `view`s; player B's sends `hello` when it joins and `ask`s for the four
 * moves B is allowed to make. Every inbound message goes through
 * `parseRoomMessage`, so junk and anything outside that list is dropped.
 */

// No I, L, O, 0 or 1: a code gets read out across a room.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

/** A fresh room code. 31^5 is about 29 million, plenty for a party game. */
export function newRoomCode(random: () => number): string {
  return Array.from(
    { length: CODE_LENGTH },
    () => ALPHABET[Math.floor(random() * ALPHABET.length)],
  ).join("");
}

/** True only for a well-formed code, so one can go straight into a channel name. */
export function isRoomCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

export function roomChannel(code: string): string {
  return `mind-reader:${code}`;
}

const viewSchema = z.object({
  phase: z.enum(["setup", "secret", "playing", "reveal"]),
  round: z.number().int().min(1),
  guessed: z.number().int().min(0),
  stumped: z.number().int().min(0),
  lastOutcome: z.enum(["guessed", "stumped"]).nullable(),
  remainingMs: z.number().finite().min(0),
  paused: z.boolean(),
  role: z.string().max(200).nullable(),
});

const askSchema = z.enum(["guessed", "pause", "resume", "giveUp"]);

const roomMessageSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("view"), view: viewSchema }),
  z.object({ t: z.literal("ask"), ask: askSchema }),
  z.object({ t: z.literal("hello") }),
]);

export type RoomMessage = z.infer<typeof roomMessageSchema>;
export type Ask = z.infer<typeof askSchema>;

export function parseRoomMessage(value: unknown): RoomMessage | null {
  const parsed = roomMessageSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type RoomTransport = {
  /** "local" is a BroadcastChannel, so it only reaches tabs in this browser. */
  readonly kind: "ably" | "local";
  send(message: RoomMessage): void;
  close(): void;
};

export type Connect = (
  code: string,
  onMessage: (message: RoomMessage) => void,
) => Promise<RoomTransport>;
