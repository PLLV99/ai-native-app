import { z } from "zod";

// Public lead form — matches the Lead model in prisma/schema.prisma.
// Optional columns are String? there, so they are .optional() here.
export const createLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(200).optional(),
  interest: z.string().trim().max(500).optional(),
});

// Public contact form — forwarded to the n8n webhook.
// `service` is a fixed list in the UI, so keep it an enum here as well:
// anything else is a client that did not come from our form.
export const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, "Invalid phone number"),
  service: z.enum([
    "ai-chatbot",
    "ai-automation",
    "ai-consulting",
    "ai-training",
  ]),
  message: z.string().trim().max(2000).optional().default(""),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().trim().max(100).optional(),
});

export const searchSchema = z.object({
  query: z.string().trim().min(1).max(500),
  // Guards the SQL LIMIT — without it a caller can ask for topK: 999999
  topK: z.coerce.number().int().min(1).max(20).default(5),
});

export const changeRoleSchema = z.object({
  userId: z.string().trim().min(1),
  newRole: z.enum(["user", "manager", "admin"]),
});

/** Turn a Zod failure into the 400 body the client sees. */
export function validationError(error: z.ZodError) {
  return {
    error: "Invalid input",
    details: z.flattenError(error).fieldErrors,
  };
}
