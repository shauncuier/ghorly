import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "লগ ইন",
  description: "ঘরলি অ্যাকাউন্টে প্রবেশ করুন।",
  robots: { index: false },
};

/**
 * `LoginForm` reads `?role=` via `useSearchParams`, which opts the route out
 * of static rendering unless it sits inside a Suspense boundary.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Someone who is already signed in has no business being shown a sign-in
  // form; send them to their dashboard instead.
  const { next } = await searchParams;
  await redirectIfAuthenticated(typeof next === "string" ? next : undefined);

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
