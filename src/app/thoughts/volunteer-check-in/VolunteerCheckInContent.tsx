import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

export default function VolunteerCheckInContent() {
  return (
    <ThoughtLayout
      breadcrumb="Volunteer check-in"
      title="Proving someone actually showed up"
      intro={
        <>
          The ask came from a conversation about volunteers: how do you confirm
          someone arrived on site, without taking their word for it and without
          buying hardware? The idea already in the room was a device at the
          location showing a code that changes every couple of minutes. That is
          a good instinct, and most of the work turned out to be in being honest
          about what such a code does and does not prove.
        </>
      }
    >
      <Section title="The idea, and the first thing that had to change">
        <p className="mb-3 text-muted">
          The original sketch had two halves: tap your phone against a device,
          and type a rotating code. The tap half died on a platform fact.{" "}
          <span className={code}>Web NFC</span> ships in Chrome on Android and
          is not supported by Safari on iOS — so an NFC tap would have worked
          for some volunteers and silently failed for everyone on an iPhone.
          Half a feature that fails by platform is worse than no feature,
          because the people it fails for look like the people who did not turn
          up.
        </p>
        <p className="text-muted">
          Typed codes work identically everywhere. So the code is the product,
          and NFC is parked behind a native app where iOS actually exposes the
          radio.
        </p>
      </Section>

      <Section title="The code is derived, never stored">
        <p className="mb-3 text-muted">
          A site&apos;s code is{" "}
          <span className={code}>
            HMAC-SHA256(secret, &quot;&lt;site salt&gt;:&lt;window&gt;&quot;)
          </span>{" "}
          truncated to six digits the way TOTP does it, where the window is{" "}
          <span className={code}>floor(now / 120s)</span>. Nothing about the
          current code lives in a row anywhere.
        </p>
        <ul className="space-y-2 text-muted">
          <Bullet>
            A database dump yields salts, not working codes. The secret is an
            environment variable that never reaches a browser.
          </Bullet>
          <Bullet>
            Rotation is free: regenerate a site&apos;s salt to kill its codes,
            rotate the env secret to kill everyone&apos;s.
          </Bullet>
          <Bullet>
            An unset secret throws instead of deriving from an empty key. That
            matters more than it sounds — an empty key still produces six
            perfectly plausible digits, so failing loudly is the difference
            between a broken deploy and a check-in system that records
            attendance while proving nothing.
          </Bullet>
        </ul>
      </Section>

      <Section title="Four ways it could have been cheated">
        <ul className="space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">Guessing.</strong> Six digits is
            a million values per window, which is not much if you can try them
            all. Five wrong guesses per volunteer per window is the ceiling, and
            it is checked <em>before</em> the code is compared — so someone
            being throttled learns nothing about whether their last guess was
            right.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Replaying.</strong> Only the
            current and immediately previous window verify. Previous is accepted
            because typing takes time; two back is not, because every extra
            window doubles how long a leaked code stays useful.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Double-counting.</strong> A
            unique <span className={code}>(site, volunteer, window)</span> with{" "}
            <span className={code}>ON CONFLICT DO NOTHING</span> means two taps
            of the button are one arrival — decided by the database rather than
            by a read-then-write race between two thumbs.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Being someone else.</strong>{" "}
            Arrivals key on the Auth0 subject of whoever is signed in, not on a
            name typed into a box. This is the reason the volunteer page asks
            for a sign-in rather than a name: a roster anyone can write into is
            a roster, not a record.
          </Bullet>
        </ul>
      </Section>

      <Section title="The hole I did not close">
        <p className="mb-3 text-muted">
          A volunteer can photograph the code and text it to a friend, who
          checks in from home. Nothing above stops that. The two-minute window
          narrows it to a live accomplice and nothing more, and no amount of
          extra digits helps — the weakness is that the code is readable by a
          human, which is also the entire reason it works on every phone.
        </p>
        <p className="text-muted">
          So the claim gets written down at the size it actually is. A check-in
          evidences that <em>someone with that volunteer&apos;s login had that
          site&apos;s code within the last two minutes</em>. That is the right
          strength for honest attendance and the wrong tool for catching a
          determined cheat. Closing it properly needs NFC or hardware
          attestation. An attendance record that overstates what it proves is
          worse than one whose limits are known, because somebody eventually
          makes a decision about a person on the strength of it.
        </p>
      </Section>

      <Section title="The state the display must never be in">
        <p className="text-muted">
          The screen at the entrance refetches exactly when its code expires,
          driven by the{" "}
          <span className={code}>secondsRemaining</span> the server reports,
          rather than by a fixed poll — so there is no gap where the wall shows
          one code and the server expects another. And if a refresh fails, the
          digits are hidden and the page says so. A dead code left on screen is
          the worst thing this page can do: volunteers type it, are told they
          are wrong, and blame themselves rather than the display. That branch
          has its own test.
        </p>
      </Section>

      <Section title="What is deliberately not built yet">
        <ul className="space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">NFC taps</strong> — Android-only
            on the web, so it waits for a native app rather than shipping a
            feature that works on half the phones.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">GPS checks</strong> — spoofable,
            and they put a location permission prompt in front of a volunteer
            before their first successful check-in. It also means storing
            location data, which needs a retention answer nobody has asked for
            yet.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Shifts</strong> — arrivals are
            timestamps, not &quot;on time for the 9am&quot;. That is a
            scheduling feature wearing an attendance feature&apos;s clothes, and
            it deserves its own thinking.
          </Bullet>
        </ul>
      </Section>

      <WhatsNext
        nowShipped={[
          "Codes derived from an HMAC over the site salt and the time window rather than stored, so a database dump yields no working code and rotation is a salt regeneration.",
          "An unset secret throws instead of deriving from an empty key — an empty key still produces six plausible digits, which would be attendance that proves nothing.",
          "A five-guess ceiling per volunteer per window, checked before the code is compared, so being throttled leaks nothing about whether the guess was right.",
          "One arrival per volunteer per window enforced by a unique constraint, so a double tap is settled by the database rather than by a race between two thumbs.",
          "The display hides its digits and says so when a refresh fails, because a dead code left on screen makes volunteers blame themselves.",
        ]}
        couldImprove={[
          "A code can still be photographed and relayed to someone off-site; the two-minute window narrows that to a live accomplice and nothing more.",
          "The organizer roster is today-only with no export, which is the first thing anyone running real shifts will ask for.",
          "Nothing here understands a shift, so arriving four hours late reads exactly like arriving on time.",
        ]}
        upcoming={[
          "NFC taps, which need a native app because Safari on iOS does not expose Web NFC.",
          "Shift windows, so an arrival can be early, on time, or late rather than just timestamped.",
          "A QR code on the display itself, so the volunteer link does not have to be typed or printed separately.",
        ]}
      />
    </ThoughtLayout>
  );
}
