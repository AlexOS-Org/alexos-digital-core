import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveContact } from "@/lib/crm/api";
import { CONTACT_STATUSES, CONTACT_SOURCES } from "@/lib/crm/constants";
import type { Contact, ContactStatus } from "@/lib/crm/types";

const schema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(80),
  last_name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  job_title: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.string().max(80).optional().or(z.literal("")),
  status: z.enum(["lead", "active", "inactive", "archived"]),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact?: Contact | null;
}

export function ContactFormDialog({ open, onOpenChange, contact }: Props) {
  const save = useSaveContact();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "lead" },
  });

  useEffect(() => {
    if (open) {
      reset({
        first_name: contact?.first_name ?? "",
        last_name: contact?.last_name ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        company: contact?.company ?? "",
        job_title: contact?.job_title ?? "",
        source: contact?.source ?? "",
        status: (contact?.status ?? "lead") as ContactStatus,
        notes: contact?.notes ?? "",
      });
    }
  }, [open, contact, reset]);

  const status = watch("status");
  const source = watch("source");

  const onSubmit = handleSubmit(async (v) => {
    await save.mutateAsync({
      id: contact?.id,
      first_name: v.first_name,
      last_name: v.last_name || null,
      email: v.email || null,
      phone: v.phone || null,
      company: v.company || null,
      job_title: v.job_title || null,
      source: v.source || null,
      status: v.status,
      notes: v.notes || null,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.first_name?.message}>
              <Input {...register("first_name")} autoFocus />
            </Field>
            <Field label="Last name" error={errors.last_name?.message}>
              <Input {...register("last_name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>
            <Field label="Company" error={errors.company?.message}>
              <Input {...register("company")} />
            </Field>
            <Field label="Job title" error={errors.job_title?.message}>
              <Input {...register("job_title")} />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setValue("status", v as ContactStatus, { shouldDirty: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source">
              <Select value={source || ""} onValueChange={(v) => setValue("source", v, { shouldDirty: true })}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {CONTACT_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notes" className="col-span-2" error={errors.notes?.message}>
              <Textarea rows={3} {...register("notes")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Contact"}</Button>
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
