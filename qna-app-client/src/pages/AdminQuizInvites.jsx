import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import { getQuiz, getQuizInvitations, sendQuizInvitations } from '@/services/services';
import QuizStatusBadge from '@/components/admin/QuizStatusBadge';
import PublishStateBadge from '@/components/admin/PublishStateBadge';
import InvitationTable from '@/components/admin/InvitationTable';
import { formatDateTime, hasEnded } from '@/lib/quizStatus';
import { useNow } from '@/hooks/useNow';
import { AdminCard, AdminPageHeader, adminInput, adminPrimaryButton } from '@/components/admin/AdminLayout';
import { summarizeInvitationResult } from '@/lib/invitationSummary';

export default function AdminQuizInvites() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [outcome, setOutcome] = useState(null);
    const [error, setError] = useState('');
    const [invitations, setInvitations] = useState([]);
    const [invitationsLoading, setInvitationsLoading] = useState(true);
    const [invitationsError, setInvitationsError] = useState('');
    const now = useNow();
    const ended = Boolean(quiz && hasEnded(quiz, now));
    const isDraft = Boolean(quiz && quiz.status !== 'published');

    const loadInvitations = useCallback(async () => {
        try {
            const data = await getQuizInvitations(quizId);
            setInvitations(Array.isArray(data) ? data : []);
            setInvitationsError('');
        } catch (err) {
            setInvitationsError(err.message || 'Unable to load invitations.');
        } finally {
            setInvitationsLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        getQuiz(quizId)
            .then(setQuiz)
            .catch((err) => setError(err.message));
        // State is only set inside loadInvitations after its await resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadInvitations();
    }, [quizId, loadInvitations]);

    const handleSendInvitation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOutcome(null);
        setError('');

        try {
            const data = await sendQuizInvitations(quizId, [email]);
            setOutcome(summarizeInvitationResult(data));
            // Only clear the field when the address itself was usable - a typo
            // should stay on screen so it can be corrected.
            if (!data?.invalid) setEmail('');
            await loadInvitations();
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Link
                to="/admin-panel/quizzes"
                className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> Back to quizzes
            </Link>

            <AdminPageHeader
                eyebrow="Invitations"
                title={quiz ? quiz.title : 'Invite students'}
                description="Send a student an email invitation to take this quiz."
            />

            <AdminCard className="max-w-xl p-6">
                {quiz && (
                    <div className="mb-5 border-b border-border pb-5">
                        <div className="flex flex-wrap items-start gap-3">
                            <PublishStateBadge status={quiz.status} className="mt-0.5" />
                            <QuizStatusBadge quiz={quiz} />
                        </div>
                        {isDraft && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                This quiz is a draft. Publish it from the quiz list before inviting students.
                            </p>
                        )}
                    </div>
                )}

                {ended && (
                    <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        This quiz ended {formatDateTime(quiz.ends_at)}, so invitations are closed. Edit the quiz and set a later end time to invite more students.
                    </p>
                )}

                <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="invite-email">Student email</label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@school.edu"
                            required
                            className={adminInput}
                        />
                    </div>

                    <button type="submit" disabled={loading || ended || isDraft} className={adminPrimaryButton}>
                        <Mail /> {loading ? 'Sending...' : 'Send invitation'}
                    </button>
                </form>

                {outcome && (
                    <p
                        role={outcome.ok ? 'status' : 'alert'}
                        className={`mt-4 text-sm ${outcome.ok ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}
                    >
                        {outcome.text}
                    </p>
                )}
                {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
            </AdminCard>

            <h2 className="mb-3 mt-8 text-lg font-bold">
                Invitations{!invitationsLoading && !invitationsError ? ` (${invitations.length})` : ''}
            </h2>
            <AdminCard className="overflow-hidden">
                <InvitationTable
                    invitations={invitations}
                    loading={invitationsLoading}
                    error={invitationsError}
                />
            </AdminCard>
        </>
    );
}
