import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Mail, Plus, X } from 'lucide-react';
import { getQuiz, getQuizInvitations, sendQuizInvitations } from '@/services/services';
import QuizStatusBadge from '@/components/admin/QuizStatusBadge';
import PublishStateBadge from '@/components/admin/PublishStateBadge';
import InvitationTable from '@/components/admin/InvitationTable';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, hasEnded } from '@/lib/quizStatus';
import { useNow } from '@/hooks/useNow';
import { AdminCard, AdminPageHeader, adminInput, adminPrimaryButton, adminSecondaryButton } from '@/components/admin/AdminLayout';
import { summarizeInvitationResult } from '@/lib/invitationSummary';

export default function AdminQuizInvites() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [email, setEmail] = useState('');
    const [emails, setEmails] = useState([]);
    const [failedEmailReasons, setFailedEmailReasons] = useState({});
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

    const addEmailValues = (value, currentEmails) => {
        const values = value.split(/[,;\s]+/).map((valueToAdd) => valueToAdd.trim()).filter(Boolean);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nextEmails = [...currentEmails];
        const invalidEmails = [];
        const duplicateEmails = [];

        values.forEach((valueToAdd) => {
            const normalizedEmail = valueToAdd.toLowerCase();
            if (!emailRegex.test(valueToAdd)) {
                invalidEmails.push(valueToAdd);
            } else if (nextEmails.some((existingEmail) => existingEmail.toLowerCase() === normalizedEmail)) {
                duplicateEmails.push(valueToAdd);
            } else {
                nextEmails.push(valueToAdd);
            }
        });

        return {
            emails: nextEmails,
            invalidEmails,
            error: invalidEmails.length
                ? `Invalid email address${invalidEmails.length > 1 ? 'es' : ''}: ${invalidEmails.join(', ')}`
                : duplicateEmails.length
                    ? `Already added: ${duplicateEmails.join(', ')}`
                    : ''
        };
    };

    const addEmailInput = (value) => {
        const result = addEmailValues(value, emails);
        setEmails(result.emails);
        setError(result.error);

        if (result.invalidEmails.length) {
            setEmail(result.invalidEmails.join(' '));
        } else if (!result.error || result.emails.length > emails.length) {
            setEmail('');
        }
        return result;
    };

    const handleAddEmail = () => {
        if (!email.trim()) {
            setError('Enter a student email address to add.');
            return;
        }
        addEmailInput(email);
    };

    const handleEmailKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const handleEmailPaste = (e) => {
        const pastedValue = e.clipboardData.getData('text');
        if (pastedValue) {
            e.preventDefault();
            addEmailInput(pastedValue);
        }
    };

    const handleSendInvitation = async (e) => {
        e.preventDefault();
        const result = email.trim() ? addEmailValues(email, emails) : { emails, error: '' };
        if (result.error) {
            setEmails(result.emails);
            setError(result.error);
            return;
        }
        if (result.emails.length === 0) {
            setError('Add at least one student email before sending invitations.');
            return;
        }

        setEmails(result.emails);
        setEmail('');
        setLoading(true);
        setOutcome(null);
        setError('');

        try {
            const data = await sendQuizInvitations(quizId, result.emails);
            setOutcome(summarizeInvitationResult(data));

            const nextFailedEmailReasons = Object.fromEntries(
                (data.failedEmails ?? []).map(({ email: failedEmail, reason }) => [failedEmail, reason])
            );

            setEmails(data.failedEmails?.map(({ email: failedEmail }) => failedEmail) ?? []);
            setFailedEmailReasons(nextFailedEmailReasons);
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
                        <div className="flex items-end gap-2">
                            <input
                                id="invite-email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={handleEmailKeyDown}
                                onPaste={handleEmailPaste}
                                placeholder="student@school.edu (supports pasting multiple)"
                                className={adminInput}
                            />
                            <button type="button" onClick={handleAddEmail} disabled={loading || ended || isDraft} className={`${adminSecondaryButton} shrink-0`}>
                                <Plus /> Add
                            </button>
                        </div>
                    </div>

                    {emails.length > 0 && (
                        <div className="flex flex-wrap gap-2" aria-label="Students to invite">
                            {emails.map((studentEmail) => (
                                <Badge key={studentEmail} variant="secondary" className="h-auto py-1 pl-3 pr-1">
                                    {studentEmail}
                                    {failedEmailReasons[studentEmail] && <span className="ml-2 text-destructive">({failedEmailReasons[studentEmail]})</span>}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmails((currentEmails) => currentEmails.filter((emailToRemove) => emailToRemove !== studentEmail));
                                            setFailedEmailReasons((currentReasons) => {
                                                const nextReasons = { ...currentReasons };
                                                delete nextReasons[studentEmail];
                                                return nextReasons;
                                            });
                                        }}
                                        aria-label={`Remove ${studentEmail}`}
                                        className="rounded-full p-0.5 hover:bg-foreground/10"
                                    >
                                        <X />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    <button type="submit" disabled={loading || ended || isDraft || (emails.length === 0 && !email.trim())} className={adminPrimaryButton}>
                        <Mail /> {loading ? 'Sending...' : 'Send all invitations'}
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