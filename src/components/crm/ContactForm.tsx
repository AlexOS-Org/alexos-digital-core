import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateContact,
} from "@/lib/crm/api";

import type { ContactFormInput } from "@/lib/crm/types";

interface ContactFormProps {
  onSuccess?: () => void;
}

const initialForm: ContactFormInput = {
  display_name: "",
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  alternate_phone: "",
  job_title: "",
  industry: "",
  source: "",
  city: "",
  county: "",
  notes: "",
};

export function ContactForm({ onSuccess }: ContactFormProps) {
  const [form, setForm] = useState<ContactFormInput>(initialForm);

  const createContact = useCreateContact();

  function updateField(
    field: keyof ContactFormInput,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.display_name.trim()) {
      return;
    }

    await createContact.mutateAsync({
      ...form,
      display_name: form.display_name.trim(),
    });

    setForm(initialForm);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Contact
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First name
              </Label>

              <Input
                id="first_name"
                value={form.first_name ?? ""}
                onChange={(event) =>
                  updateField(
                    "first_name",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last name
              </Label>

              <Input
                id="last_name"
                value={form.last_name ?? ""}
                onChange={(event) =>
                  updateField(
                    "last_name",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">
                Display name *
              </Label>

              <Input
                id="display_name"
                required
                value={form.display_name}
                onChange={(event) =>
                  updateField(
                    "display_name",
                    event.target.value,
                  )
                }
                placeholder="e.g. Brian Otieno"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company
              </Label>

              <Input
                id="company_name"
                value={form.company_name ?? ""}
                onChange={(event) =>
                  updateField(
                    "company_name",
                    event.target.value,
                  )
                }
                placeholder="Company or business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">
                Job title
              </Label>

              <Input
                id="job_title"
                value={form.job_title ?? ""}
                onChange={(event) =>
                  updateField(
                    "job_title",
                    event.target.value,
                  )
                }
                placeholder="e.g. Managing Director"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone
              </Label>

              <Input
                id="phone"
                type="tel"
                value={form.phone ?? ""}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value,
                  )
                }
                placeholder="+254..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternate_phone">
                Alternate phone
              </Label>

              <Input
                id="alternate_phone"
                type="tel"
                value={form.alternate_phone ?? ""}
                onChange={(event) =>
                  updateField(
                    "alternate_phone",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">
                Source
              </Label>

              <Input
                id="source"
                value={form.source ?? ""}
                onChange={(event) =>
                  updateField(
                    "source",
                    event.target.value,
                  )
                }
                placeholder="Facebook, referral, WhatsApp..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry
              </Label>

              <Input
                id="industry"
                value={form.industry ?? ""}
                onChange={(event) =>
                  updateField(
                    "industry",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">
                City
              </Label>

              <Input
                id="city"
                value={form.city ?? ""}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">
                County
              </Label>

              <Input
                id="county"
                value={form.county ?? ""}
                onChange={(event) =>
                  updateField(
                    "county",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes
            </Label>

            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              placeholder="What should Orion remember about this relationship?"
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                createContact.isPending ||
                !form.display_name.trim()
              }
            >
              {createContact.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Save Contact
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}