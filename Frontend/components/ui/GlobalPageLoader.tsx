import { ProjectLogoIcon } from "@/components/AppLogo";

export function GlobalPageLoader({
  message = "Loading StudyAI Workspace…",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-[400px] py-16 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center animate-bounce shadow-md shadow-blue-500/20">
        <ProjectLogoIcon size={26} variant="white" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default GlobalPageLoader;
