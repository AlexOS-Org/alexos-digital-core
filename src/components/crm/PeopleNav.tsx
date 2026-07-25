import { Link, useRouterState } from "@tanstack/react-router";
import { Users, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/people", label: "Contacts", icon: Users, exact: true },
  { to: "/people/leads", label: "Leads Pipeline", icon: KanbanSquare },
];

export function PeopleNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 sticky top-14 z-[5] bg-background/85 backdrop-blur">
      <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-thin">
        {links.map((link) => {
          const active = link.exact
            ? path === link.to || path.startsWith("/people/contacts")
            : path.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
