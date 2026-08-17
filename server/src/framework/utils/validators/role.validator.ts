import { z } from "zod";

export const roleValidator = z.object({
  name: z.string().min(1, { message: "Role name is required." }),
  permissions: z.array(z.string()).nonempty({ message: "At least one permission is required." }),
});
