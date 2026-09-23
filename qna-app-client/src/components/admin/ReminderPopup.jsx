import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInput } from "@/components/admin/AdminLayout";

export default function ReminderPopup({ invitations, onClose, onRemind, loading = false }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [optimisticallyReminded, setOptimisticallyReminded] = useState(() => new Set());
  const pendingInvitations = invitations.filter((invitation) =>
    invitation.status === "sent" && !invitation.reminded_at && !invitation.reminder_count && !optimisticallyReminded.has(invitation.email)
  );
  const visibleInvitations = pendingInvitations.filter((invitation) =>
    invitation.email.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggleEmail(email) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  async function handleRemind() {
    const selectedEmails = [...selected];
    setOptimisticallyReminded((current) => new Set([...current, ...selectedEmails]));
    setSelected(new Set());

    try {
      const result = await onRemind(selectedEmails);
      const failedEmails = new Set((result?.failedEmails ?? []).map(({ email }) => email));
      if (failedEmails.size > 0) {
        setOptimisticallyReminded((current) => new Set(
          [...current].filter((email) => !failedEmails.has(email))
        ));
      }
    } catch (error) {
      setOptimisticallyReminded((current) => new Set(
        [...current].filter((email) => !selectedEmails.includes(email))
      ));
      throw error;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-popup-title"
        className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
      >
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 id="reminder-popup-title" className="text-lg font-bold">Remind students</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose students who have not accepted the invitation.</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close reminder popup">
            <X />
          </Button>
        </header>

        <label className="relative mt-5 block" htmlFor="reminder-search">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="reminder-search"
            aria-label="Search student emails"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student emails"
            className={`${adminInput} pl-9`}
          />
        </label>

        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-border" aria-label="Students to remind">
          {visibleInvitations.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">No pending invitations found.</p>
          ) : (
            visibleInvitations.map((invitation) => (
              <label key={invitation.id ?? invitation.email} className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <input
                  type="checkbox"
                  checked={selected.has(invitation.email)}
                  onChange={() => toggleEmail(invitation.email)}
                  aria-label={`Remind ${invitation.email}`}
                />
                <span className="text-sm">{invitation.email}</span>
              </label>
            ))
          )}
        </div>

        <footer className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleRemind} disabled={loading || selected.size === 0}>
            {loading ? "Sending..." : "Remind"}
          </Button>
        </footer>
      </section>
    </div>
  );
}