"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/actions/auth/login";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Sai tên đăng nhập hoặc mật khẩu.",
  MISSING_CREDENTIALS: "Vui lòng nhập đầy đủ thông tin.",
};

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    startTransition(async () => {
      const result = await login({ username, password });
      // If result is void the server redirected — nothing to do here.
      if (result && !result.success) {
        setError(ERROR_MESSAGES[result.error] ?? result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Smart WMS</h1>
        <p className="mt-1 text-sm text-gray-500">
          Đăng nhập để tiếp tục
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Tên đăng nhập"
          name="username"
          id="username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          placeholder="admin"
          disabled={isPending}
        />
        <Input
          label="Mật khẩu"
          name="password"
          id="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isPending}
          className="mt-2 w-full"
        >
          {isPending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
