import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar as CalendarIcon,
  StickyNote,
  Paperclip,
  CheckCircle2,
  Circle,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  useActivities,
  useAddActivity,
  useAddCrmAttachment,
  useAddCrmNote,
  useAddCrmTask,
  useCrmAttachments,
  useCrmNotes,
  useCrmTasks,
  useToggleCrmTask,
} from "@/lib/crm/api";
import { ACTIVITY_TYPES } from "@/lib/crm/constants";
import type { CrmActivityType } from "@/lib/crm/types";

type Scope = { contactId?: string; leadId?: string };

const ACTIVITY_ICON: Record<CrmActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: CalendarIcon,
  note: StickyNote,
  other: MessageSquare,
};

export function ActivitiesTab({ scope }: { scope: Scope }) {
  const { data: activities = [], isLoading } = useActivities(scope);
  const add = useAddActivity(scope);
  const [type, setType] = useState<CrmActivityType>("call");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const submit = async () => {
    if (!subject.trim()) return;
    await add.mutateAsync({ type, subject, body });
    setSubject("");
    setBody("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CrmActivityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Discovery call, follow-up email..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Details</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Notes on the interaction"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={add.isPending || !subject.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Log activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : activities.length === 0 ? (
        <EmptyBlock icon={MessageSquare} text="No activities logged yet." />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const Icon = ACTIVITY_ICON[a.type];
            return (
              <div key={a.id} className="flex gap-3 rounded-xl border bg-card p-4">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{a.subject}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(a.occurred_at), { addSuffix: true })}
                    </span>
                  </div>
                  {a.body ? (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {a.body}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TasksTab({ scope }: { scope: Scope }) {
  const { data: tasks = [], isLoading } = useCrmTasks(scope);
  const add = useAddCrmTask(scope);
  const toggle = useToggleCrmTask(scope);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    await add.mutateAsync({ title, due_date: due || null });
    setTitle("");
    setDue("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen next?"
          />
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="sm:w-40"
          />
          <Button onClick={submit} disabled={add.isPending || !title.trim()}>
            Add task
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : tasks.length === 0 ? (
        <EmptyBlock icon={CheckCircle2} text="No tasks yet." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const done = t.status === "done";
            return (
              <button
                key={t.id}
                onClick={() => toggle.mutate(t)}
                className="w-full flex items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-accent/40 transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className={cn("text-sm", done && "line-through text-muted-foreground")}>
                    {t.title}
                  </p>
                  {t.due_date ? (
                    <p className="text-xs text-muted-foreground">Due {t.due_date}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NotesTab({ scope }: { scope: Scope }) {
  const { data: notes = [], isLoading } = useCrmNotes(scope);
  const add = useAddCrmNote(scope);
  const [body, setBody] = useState("");

  const submit = async () => {
    if (!body.trim()) return;
    await add.mutateAsync(body);
    setBody("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Capture something worth remembering..."
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={add.isPending || !body.trim()}>
              Save note
            </Button>
          </div>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : notes.length === 0 ? (
        <EmptyBlock icon={StickyNote} text="No notes yet." />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-4">
              <p className="text-sm whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AttachmentsTab({ scope }: { scope: Scope }) {
  const { data: items = [], isLoading } = useCrmAttachments(scope);
  const add = useAddCrmAttachment(scope);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const submit = async () => {
    if (!name.trim() || !url.trim()) return;
    await add.mutateAsync({ name, url });
    setName("");
    setUrl("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="File name" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <Button onClick={submit} disabled={add.isPending || !name.trim() || !url.trim()}>
            Attach
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : items.length === 0 ? (
        <EmptyBlock icon={Paperclip} text="No attachments." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-accent/40"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.url}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyBlock({ icon: Icon, text }: { icon: typeof Phone; text: string }) {
  return (
    <div className="text-center py-10 border rounded-xl bg-muted/20">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Silence unused import warning for Checkbox in case tree-shaking flags it.
export const __unused = Checkbox;
