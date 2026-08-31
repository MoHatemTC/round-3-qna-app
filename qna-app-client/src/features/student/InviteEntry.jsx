import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function InviteEntry() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/student/invite/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorType(data.error);
          setStatus("error");
        } else {
          // valid quiz found — go to it (we'll build this page next)
          navigate(`/quiz/${data.id}`);
        }
      })
      .catch(() => {
        setErrorType("invalid_link");
        setStatus("error");
      });
  }, [token, navigate]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Checking your invite link...</div>;
  }

  const messages = {
    invalid_link: "This invite link isn't valid. Double-check the link you were sent.",
    not_open_yet: "This quiz isn't open yet. Check back closer to the start time.",
    closed: "This quiz has closed and is no longer accepting responses.",
    already_submitted: "You've already submitted this quiz. Only one attempt is allowed.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border rounded-lg shadow-sm p-8 max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Can't open this quiz</h2>
        <p className="text-muted-foreground">{messages[errorType] ?? "Something went wrong."}</p>
      </div>
    </div>
  );
}