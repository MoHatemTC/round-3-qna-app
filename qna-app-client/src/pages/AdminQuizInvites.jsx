import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';

export default function AdminQuizInvites() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSendInvitation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch(`http://localhost:3000/admin/quizzes/${quizId}/invitations`, {
                method: 'POST',
                "credentials": "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send invitation');
            }

            setMessage('Invitation sent successfully to ' + email);
            setEmail('');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <button onClick={() => navigate('/admin-panel')} style={{ marginBottom: '20px', cursor: 'pointer' }}>
                &larr; Back to Quizzes
            </button>

            <h2>Invite Students to Quiz</h2>
            <p style={{ color: '#666' }}>Quiz ID: {quizId}</p>

            <form onSubmit={handleSendInvitation} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Student Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        required
                        style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
                >
                    {loading ? 'Sending...' : 'Send Invitation'}
                </button>
            </form>

            {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        </div>
    );
}