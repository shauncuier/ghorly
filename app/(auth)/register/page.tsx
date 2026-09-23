import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectIfAuthenticated } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "নিবন্ধন",
  description: "ঘরলিতে বিনামূল্যে অ্যাকাউন্ট খুলুন।",
  robots: { index: false },
};

export default async function RegisterPage() {
  await redirectIfAuthenticated();
  return <RegisterForm />;
}
