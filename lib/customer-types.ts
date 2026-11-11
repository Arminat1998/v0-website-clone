import { z } from "zod";

const shortText = z.string().trim().max(160);
export const customerProfileSchema = z
  .object({
    firstName: shortText.min(1),
    lastName: shortText.min(1),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((value) => !value || /^[+\d\s().-]{6,40}$/.test(value)),
    customerType: z.enum(["private", "business"]),
    companyName: shortText,
    billingStreet: shortText,
    billingHouseNumber: z.string().trim().max(20),
    billingPostalCode: z.string().trim().max(20),
    billingCity: shortText,
    billingCountry: shortText,
    vatNumber: z.string().trim().max(40),
  })
  .refine(
    (value) =>
      value.customerType !== "business" || value.companyName.length > 0,
    { path: ["companyName"], message: "Company name required" },
  );

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type FavoriteType = "artist" | "photographer";
export interface FavoriteItem {
  professionalId: string;
  professionalType: FavoriteType;
  name: string;
  specialty: string;
  location: string;
  price: string;
  image: string | null;
  href: string;
  available: boolean;
}
