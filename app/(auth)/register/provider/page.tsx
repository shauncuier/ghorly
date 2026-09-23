import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProviderRegisterForm } from "@/components/auth/provider-register-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "পেশাদার নিবন্ধন",
  description: "ঘরলিতে পেশাদার হিসেবে যোগ দিন — নিবন্ধন বিনামূল্যে।",
  robots: { index: false },
};

export default async function ProviderRegisterPage() {
  // Deliberately NOT `redirectIfAuthenticated`: a signed-in customer joining as
  // a professional is the normal path onto this page, so only someone who is
  // already a provider gets sent away.
  const session = await getSession();
  if (session?.roles.includes("provider")) redirect("/provider");

  return <ProviderRegisterForm />;
}
