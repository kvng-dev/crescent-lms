import { emailOTPClient } from "better-auth/client/plugins";
import { admin } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  plugins: [emailOTPClient(), admin()],
});
