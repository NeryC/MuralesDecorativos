"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, GitCompare, ClipboardList, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  pendingMuralesCount?: number;
  pendingModificacionesCount?: number;
}

export function AdminSidebar({
  pendingMuralesCount = 0,
  pendingModificacionesCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = [
    { href: "/admin", label: "Murales", icon: Map, badge: pendingMuralesCount },
    {
      href: "/admin/modificaciones",
      label: "Modificaciones",
      icon: GitCompare,
      badge: pendingModificacionesCount,
    },
    { href: "/admin/auditoria", label: "Auditoría", icon: ClipboardList },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-48 bg-[hsl(222_47%_7%)] text-white border-r border-[hsl(215_25%_20%)]">
      <div className="px-4 py-4 border-b border-[hsl(215_25%_20%)]">
        <div className="font-semibold text-sm">Murales Políticos</div>
        <div className="text-xs text-white/60 mt-0.5">Panel de gestión</div>
      </div>

      <nav className="flex-1 py-2" aria-label="Navegación admin">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors",
                "hover:bg-white/5",
                active && "bg-white/10 text-white border-l-2 border-accent",
                !active && "text-white/80",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </span>
              {item.badge && item.badge > 0 ? (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[hsl(215_25%_20%)] p-2 flex flex-col gap-1">
        <Button asChild variant="ghost" size="sm" className="justify-start text-white/80 hover:text-white hover:bg-white/5">
          <Link href="/">
            <Home className="size-4" aria-hidden="true" />
            Ver mapa público
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="justify-start text-white/80 hover:text-white hover:bg-white/5"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
