import { redirect } from "next/navigation";
import { getCurrentUserProvider } from "@/lib/application-services";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserProvider().getCurrentUser();

  if (!user) {
    redirect("/iniciar-sesion?siguiente=/admin/expedientes");
  }

  if (user.role !== "ADMIN" && user.role !== "ADVISOR") {
    redirect("/panel");
  }

  return (
    <div className="admin-layout min-h-screen bg-soft">
      <header className="bg-ink text-surface py-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="bg-brand text-white font-bold py-1 px-3 rounded-md text-xs uppercase tracking-wider">
              Admin / Asesoría
            </span>
            <span className="font-semibold">{user.displayName || user.email}</span>
          </div>
          <nav>
            <a href="/panel" className="text-surface/80 hover:text-white text-sm font-medium transition-colors">
              Volver a mi panel
            </a>
          </nav>
        </div>
      </header>
      <main className="pt-8">
        {children}
      </main>
    </div>
  );
}
