
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { studentAuthService } from "@/services/studentAuthService";

export const Route = createFileRoute("/student-login")({
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        await studentAuthService.register({
          name,
          email,
          mobile,
          password,
        });
      } else {
        await studentAuthService.login({
          email,
          password,
        });
      }

      // Keep the redirect inside this website.
     
const params = new URLSearchParams(window.location.search);
const next = params.get("next");

const safeNext =
  next &&
  next.startsWith("/") &&
  !next.startsWith("//") &&
  !next.includes("\\")
    ? next
    : "/student-dashboard";

window.location.assign(safeNext);

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Student Login" : "Create Student Account"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Login or register to access your purchased courses and products.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-lg border px-4 py-2"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className="flex-1 rounded-lg border px-4 py-2"
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mobile Number
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  maxLength={15}
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email Address
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            {mode === "register" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            )}
          </div>

          {message && (
            <p role="alert" className="text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>
      </div>
    </main>
  );
}
