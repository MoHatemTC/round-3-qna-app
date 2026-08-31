import { useParams } from "react-router-dom";

export default function QuizPlaceholder() {
  const { id } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">✅ Landed on Quiz #{id} — invite resolved correctly!</p>
    </div>
  );
}