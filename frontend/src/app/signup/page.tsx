"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { Button, Card, Input, Label, Spinner } from "@/components/ui/ui";

export default function SignupPage() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(form);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-violet-600 text-base font-bold text-white mx-auto">
            cX
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
            Create your organization
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Start tracking your social &amp; product analytics
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="org">Organization name</Label>
              <Input
                id="org"
                required
                value={form.organizationName}
                onChange={update("organizationName")}
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={update("name")}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={update("password")}
                placeholder="At least 8 characters"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner /> : "Create organization"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
