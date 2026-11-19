"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AccountHeading } from "./account-common";
import { AccountProfilePhoto } from "./profile-photo";
import { saveCustomerProfile } from "@/app/actions/customer";
import {
  customerProfileSchema,
  type CustomerProfileInput,
} from "@/lib/customer-types";
import { authClient } from "@/lib/auth-client";
import {
  lettersOnly,
  phoneChars,
  postalCodeChars,
} from "@/lib/input-filters";

const keep = (value: string) => value;
/** Characters that do not belong in a field are dropped while typing. */
const FIELD_FILTERS: Partial<Record<string, (value: string) => string>> = {
  firstName: lettersOnly,
  lastName: lettersOnly,
  phone: phoneChars,
  billingCity: lettersOnly,
  billingPostalCode: postalCodeChars,
};

export function AccountProfileForm({
  profile,
}: {
  profile: CustomerProfileInput & { email: string; image: string | null };
}) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const { email: _email, image: _image, ...initialValues } = profile;
  const [values, setValues] = useState<CustomerProfileInput>(initialValues);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    const parsed = customerProfileSchema.safeParse(values);
    if (!parsed.success) {
      setInvalid(parsed.error.issues.map((issue) => String(issue.path[0])));
      setSaveError(true);
      setFeedback(
        nl
          ? "Controleer de gemarkeerde velden."
          : "Check the highlighted fields.",
      );
      return;
    }
    setInvalid([]);
    setSaving(true);
    try {
      const result = await saveCustomerProfile(parsed.data);
      if (!result.ok) throw new Error("Invalid profile");
      setSaveError(false);
      setFeedback(
        nl ? "Je gegevens zijn opgeslagen." : "Your details have been saved.",
      );
      router.refresh();
    } catch {
      setSaveError(true);
      setFeedback(
        nl
          ? "Opslaan is niet gelukt. Probeer opnieuw."
          : "Could not save. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  function field(
    key: Exclude<keyof CustomerProfileInput, "customerType">,
    label: string,
    autoComplete?: string,
    required = false,
  ) {
    return (
      <Field key={key} data-invalid={invalid.includes(key)}>
        <FieldLabel htmlFor={key}>
          {label}
          {required ? " *" : ""}
        </FieldLabel>
        <Input
          id={key}
          name={key}
          value={values[key]}
          autoComplete={autoComplete}
          type={key === "phone" ? "tel" : "text"}
          maxLength={
            key === "phone" || key === "vatNumber"
              ? 40
              : key === "billingHouseNumber" || key === "billingPostalCode"
                ? 20
                : 160
          }
          required={required}
          aria-invalid={invalid.includes(key)}
          onChange={(e) =>
            setValues({ ...values, [key]: (FIELD_FILTERS[key] ?? keep)(e.target.value) })
          }
        />
      </Field>
    );
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    if (newPassword !== confirmPassword || newPassword.length < 8) {
      setPasswordError(true);
      setPasswordMessage(
        nl
          ? "Gebruik minimaal 8 tekens en twee gelijke nieuwe wachtwoorden."
          : "Use at least 8 characters and matching new passwords.",
      );
      return;
    }
    setPasswordBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error("Password update failed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(false);
      setPasswordMessage(
        nl
          ? "Wachtwoord gewijzigd. Andere sessies zijn uitgelogd."
          : "Password updated. Other sessions have been signed out.",
      );
    } catch {
      setPasswordError(true);
      setPasswordMessage(
        nl
          ? "Wijzigen is niet gelukt. Controleer je huidige wachtwoord."
          : "Could not update. Check your current password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-8">
      <AccountHeading
        title={nl ? "Mijn gegevens" : "My details"}
        description={
          nl
            ? "Sla je gegevens op en vul je volgende boeking sneller in."
            : "Save your details for a faster booking next time."
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <form onSubmit={save} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {nl ? "Contactgegevens" : "Contact details"}
              </CardTitle>
              <CardDescription>
                {nl
                  ? "Alleen jij en de betrokken professional hebben toegang tot de benodigde boekingsgegevens."
                  : "Only you and the relevant professional can access the necessary booking details."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field(
                    "firstName",
                    nl ? "Voornaam" : "First name",
                    "given-name",
                    true,
                  )}
                  {field(
                    "lastName",
                    nl ? "Achternaam" : "Last name",
                    "family-name",
                    true,
                  )}
                </div>
                <Field>
                  <FieldLabel htmlFor="profile-email">
                    {nl ? "E-mailadres" : "Email address"}
                  </FieldLabel>
                  <Input
                    id="profile-email"
                    value={profile.email}
                    readOnly
                    type="email"
                  />
                  <p className="text-sm text-muted-foreground">
                    {nl
                      ? "Dit is het e-mailadres waarmee je inlogt."
                      : "This is the email address you use to sign in."}
                  </p>
                </Field>
                {field("phone", nl ? "Telefoonnummer" : "Phone number", "tel")}
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {nl ? "Factuurgegevens" : "Billing details"}
              </CardTitle>
              <CardDescription>
                {nl
                  ? "Deze gegevens worden bij een nieuwe boeking voorgesteld. Bestaande boekingen blijven ongewijzigd."
                  : "These details are suggested for new bookings. Existing bookings are not changed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    {nl ? "Ik boek als" : "I am booking as"}
                  </FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={values.customerType}
                    onValueChange={(value) => {
                      if (value === "private" || value === "business")
                        setValues({ ...values, customerType: value });
                    }}
                    aria-label={nl ? "Klanttype" : "Customer type"}
                    variant="outline"
                  >
                    <ToggleGroupItem value="private">
                      {nl ? "Particulier" : "Individual"}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="business">
                      {nl ? "Zakelijk" : "Business"}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
                {values.customerType === "business" && (
                  <>
                    {field(
                      "companyName",
                      nl ? "Bedrijfsnaam" : "Company name",
                      "organization",
                      true,
                    )}
                    {field("vatNumber", nl ? "Btw-nummer" : "VAT number")}
                  </>
                )}
                <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                  {field(
                    "billingStreet",
                    nl ? "Straat" : "Street",
                    "address-line1",
                  )}
                  {field(
                    "billingHouseNumber",
                    nl ? "Huisnummer" : "House number",
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field(
                    "billingPostalCode",
                    nl ? "Postcode" : "Postal code",
                    "postal-code",
                  )}
                  {field(
                    "billingCity",
                    nl ? "Plaats" : "City",
                    "address-level2",
                  )}
                </div>
                {field(
                  "billingCountry",
                  nl ? "Land" : "Country",
                  "country-name",
                )}
              </FieldGroup>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {nl ? "Gegevens opslaan" : "Save details"}
            </Button>
            {feedback && (
              <p role={saveError ? "alert" : "status"} className="text-sm">
                {feedback}
              </p>
            )}
          </div>
        </form>
        <div className="flex flex-col gap-6">
        <AccountProfilePhoto
          name={`${profile.firstName} ${profile.lastName}`.trim() || profile.email}
          image={profile.image}
        />
        <Card>
          <CardHeader>
            <CardTitle>
              {nl ? "Accountbeveiliging" : "Account security"}
            </CardTitle>
            <CardDescription>
              {nl
                ? "Wijzig je wachtwoord. Je blijft op dit apparaat ingelogd."
                : "Change your password. You will stay signed in on this device."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword}>
              <FieldGroup>
                {[
                  {
                    id: "current-password",
                    label: nl ? "Huidig wachtwoord" : "Current password",
                    value: currentPassword,
                    set: setCurrentPassword,
                    autoComplete: "current-password",
                  },
                  {
                    id: "new-password",
                    label: nl ? "Nieuw wachtwoord" : "New password",
                    value: newPassword,
                    set: setNewPassword,
                    autoComplete: "new-password",
                  },
                  {
                    id: "confirm-password",
                    label: nl
                      ? "Herhaal nieuw wachtwoord"
                      : "Confirm new password",
                    value: confirmPassword,
                    set: setConfirmPassword,
                    autoComplete: "new-password",
                  },
                ].map((item) => (
                  <Field key={item.id}>
                    <FieldLabel htmlFor={item.id}>{item.label}</FieldLabel>
                    <Input
                      id={item.id}
                      type="password"
                      autoComplete={item.autoComplete}
                      minLength={8}
                      maxLength={128}
                      value={item.value}
                      required
                      onChange={(e) => item.set(e.target.value)}
                    />
                  </Field>
                ))}
                <Button type="submit" variant="outline" disabled={passwordBusy}>
                  {passwordBusy ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  {nl ? "Wachtwoord wijzigen" : "Change password"}
                </Button>
                {passwordMessage && (
                  <p
                    role={passwordError ? "alert" : "status"}
                    className="text-sm"
                  >
                    {passwordMessage}
                  </p>
                )}
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
