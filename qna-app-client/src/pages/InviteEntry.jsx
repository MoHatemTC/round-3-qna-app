import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "@/lib/api";

export default function InviteEntry() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(`/student/invite/${token}`)
      .then((data) => {
        if (!active) return;
        if (data?.error) {
          setErrorType(data.error);
          setStatus("error");
        } else {
          navigate(`/quiz/${data?.id}/instructions`);
        }
      })
      .catch((err) => {
        if (active) {
          setErrorType(err.status === 401 ? "unauthorized" : "invalid_link");
          setStatus("error");
        }
      });
    return () => { active = false; };
  }, [token, navigate]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Checking your invite link...</div>;
  }

  const messages = {
    invalid_link: "This invite link isn't valid. Double-check the link you were sent.",
    not_open_yet: "This quiz isn't open yet. Check back closer to the start time.",
    closed: "This quiz has closed and is no longer accepting responses.",
    already_submitted: "You've already submitted this quiz. Only one attempt is allowed.",
    unauthorized: "Please sign in before opening this invite link.",
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