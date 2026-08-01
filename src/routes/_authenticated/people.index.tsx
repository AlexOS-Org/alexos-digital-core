import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Users,
  Edit3,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts, useDeleteContact } from "@/lib/crm/api";
import { CONTACT_STATUSES } from "@/lib/crm/constants";
import { contactDisplayName } from "@/lib/crm/utils";
import { ContactAvatar } from "@/components/crm/ContactAvatar";
import { ContactFormDialog } from "@/components/crm/ContactFormDialog";
import type { Contact, ContactStatus } from "@/lib/crm/types";

export const Route = createFileRoute("/_authenticated/people/")({
  component: ContactsPage,
  head: () => ({
    meta: [
      { title: "Contacts · AlexOS" },
      {
        name: "description",
        content: "Search, filter, and manage every customer, lead, and partner in one unified CRM.",
      },
    ],
  }),
});

const PAGE_SIZE = 10;

const STATUS_TONE: Record<ContactStatus, string> = {
  lead: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

function ContactsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useContacts({ search, status });
  const del = useDeleteContact();

  const totalPages = Math.max(1, Math.ceil(contacts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => contacts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [contacts, currentPage],
  );

  const stats = useMemo(() => {
    const s = { total: contacts.length, leads: 0, active: 0, inactive: 0 };
    contacts.forEach((c) => {
      if (c.status === "lead") s.leads++;
      else if (c.status === "active") s.active++;
      else if (c.status === "inactive") s.inactive++;
    });
    return s;
  }, [contacts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage customers, leads and relationships.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Contact
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Leads" value={stats.leads} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-base">All Contacts</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, company..."
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CONTACT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              onCreate={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((c) => (
                      <TableRow key={c.id} className="group">
                        <TableCell>
                          <Link
                            to="/people/contacts/$id"
                            params={{ id: c.id }}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <ContactAvatar contact={c} />
                            <div>
                              <div className="font-medium">{contactDisplayName(c)}</div>
                              {c.job_title ? (
                                <div className="text-xs text-muted-foreground">{c.job_title}</div>
                              ) : null}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {c.company ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {c.company}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-xs">
                            {c.email ? (
                              <a
                                href={`mailto:${c.email}`}
                                className="inline-flex items-center gap-1 hover:text-primary"
                              >
                                <Mail className="h-3 w-3" /> {c.email}
                              </a>
                            ) : null}
                            {c.phone ? (
                              <a
                                href={`tel:${c.phone}`}
                                className="inline-flex items-center gap-1 hover:text-primary"
                              >
                                <Phone className="h-3 w-3" /> {c.phone}
                              </a>
                            ) : null}
                            {!c.email && !c.phone ? (
                              <span className="text-muted-foreground">—</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_TONE[c.status]}>
                            {CONTACT_STATUSES.find((s) => s.value === c.status)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to="/people/contacts/$id" params={{ id: c.id }}>
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(c);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit3 className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm(`Delete ${contactDisplayName(c)}?`)) del.mutate(c.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 ? (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <ContactFormDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editing} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-16 text-center">
      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold">No contacts yet</h2>
      <p className="text-muted-foreground mt-1 mb-4">
        Add your first customer, lead or partner to get started.
      </p>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" /> New Contact
      </Button>
    </div>
  );
}
