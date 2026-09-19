import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/quizStatus"

const statusStyles = {
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  accepted: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
}

function MessageRow({ children, className }) {
  return (
    <tr>
      <td colSpan={3} className={cn("px-5 py-8 text-center text-muted-foreground", className)}>
        {children}
      </td>
    </tr>
  )
}

// Renders GET /admin/quizzes/:id/invitations: recipient, status, sent_at.
export default function InvitationTable({ invitations, loading, error }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
            <th className="px-5 py-3 font-medium">Recipient</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Sent at</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <MessageRow>Loading invitations...</MessageRow>
          ) : error ? (
            <MessageRow className="text-destructive">
              <span role="alert">{error}</span>
            </MessageRow>
          ) : invitations.length === 0 ? (
            <MessageRow>No invitations sent for this quiz yet.</MessageRow>
          ) : (
            invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-foreground">{invitation.email}</p>
                  {invitation.user?.name && (
                    <p className="text-xs text-muted-foreground">{invitation.user.name}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                      statusStyles[invitation.status] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {invitation.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {invitation.sent_at ? formatDateTime(invitation.sent_at) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
