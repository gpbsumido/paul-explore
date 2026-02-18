import { Button, Modal } from "@/components/ui";

export default function ErrorRowModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Stats error info">
      <div className="flex flex-col gap-3">
        <h3 className="text-[17px] font-semibold text-foreground">
          Why did this fail?
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          Stats are fetched from the official NBA API, which is rate-limited —
          so some requests may fail when too many are made at once.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Results are cached for an hour, so new stats may only be updated
          daily.
        </p>
        <Button variant="primary" size="sm" onClick={onClose}>
          OK
        </Button>
      </div>
    </Modal>
  );
}
