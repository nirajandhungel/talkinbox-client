import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <SearchX size={36} className="text-slate-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800 mb-2">404</h1>
      <p className="text-sm text-slate-500 mb-1">Page not found</p>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The page you're looking for doesn't exist or has been moved.
        Check the URL or navigate back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={13} />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          size="sm"
          icon={<Home size={13} />}
          onClick={() => navigate("/")}
        >
          Dashboard
        </Button>
      </div>
    </div>
  );
}
