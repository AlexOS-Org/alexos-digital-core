import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContacts, useSaveLead } from "@/lib/crm/api";
import { LEAD_STAGES } from "@/lib/crm/constants";
import { contactDisplayName } from "@/lib/crm/utils";
import type { Lead, LeadStage } from "@/lib/crm/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]),
  value: z.coerce.number().min(0),
  probability: z.coerce.number().min(0).max(100),
  expected_close_date: z.string().optional().or(z.literal("")),
  source: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | null;
  defaultContactId?: string;
  defaultStage?: LeadStage;
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  defaultContactId,
  defaultStage,
}: Props) {
  const save = useSaveLead();
  const { data: contacts = [] } = useContacts();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stage: "new", value: 0, probability: 20 },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: lead?.title ?? "",
        contact_id: lead?.contact_id ?? defaultContactId ?? "",
        stage: (lead?.stage ?? defaultStage ?? "new") as LeadStage,
        value: Number(lead?.value ?? 0),
        probability: lead?.probability ?? 20,
        expected_close_date: lead?.expected_close_date ?? "",
        source: lead?.source ?? "",
        notes: lead?.notes ?? "",
      });
    }
  }, [open, lead, defaultContactId, defaultStage, reset]);

  const stage = watch("stage");
  const contact_id = watch("contact_id");

  const onSubmit = handleSubmit(async (v) => {
    await save.mutateAsync({
      id: lead?.id,
      title: v.title,
      contact_id: v.contact_id || null,
      stage: v.stage,
      value: Number(v.value) || 0,
      probability: Number(v.probability) || 0,
      expected_close_date: v.expected_close_date || null,
      source: v.source || null,
      notes: v.notes || null,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" className="col-span-2" error={errors.title?.message}>
              <Input
                {...register("title")}
                autoFocus
                placeholder="e.g. Corporate account onboarding"
              />
            </Field>
            <Field label="Contact" className="col-span-2">
              <Select
                value={contact_id || "__none"}
                onValueChange={(v) =>
                  setValue("contact_id", v === "__none" ? "" : v, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— No contact —</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {contactDisplayName(c)}
                      {c.company ? ` · ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stage">
              <Select
                value={stage}
                onValueChange={(v) => setValue("stage", v as LeadStage, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source">
              <Input {...register("source")} placeholder="Referral, LinkedIn..." />
            </Field>
            <Field label="Value (KES)" error={errors.value?.message}>
              <Input type="number" step="0.01" {...register("value")} />
            </Field>
            <Field label="Probability (%)" error={errors.probability?.message}>
              <Input type="number" min={0} max={100} {...register("probability")} />
            </Field>
            <Field label="Expected close" className="col-span-2">
              <Input type="date" {...register("expected_close_date")} />
            </Field>
            <Field label="Notes" className="col-span-2" error={errors.notes?.message}>
              <Textarea rows={3} {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
