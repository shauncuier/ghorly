import { AdminShell } from "@/components/app-shell/admin-shell";
import { requireRole } from "@/lib/auth/guard";

/**
 * Server layout wrapping a client shell.
 *
 * Stays a server component so each route below can still `export const
 * metadata` — a client component cannot — and so the role can be enforced
 * before anything renders. `proxy.ts` only checks that a cookie exists;
 * this verifies the signature and the role.
 */
export default async function Layout({ children }: LayoutProps<"/admin">) {
  await requireRole("admin");
  return <AdminShell>{children}</AdminShell>;
}
