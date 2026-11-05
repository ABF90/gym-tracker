import { AuthScreen, LoginForm } from "@/features/auth/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { mode } = await searchParams;
  return (
    <AuthScreen>
      <LoginForm initialMode={mode === "signup" ? "signup" : "signin"} />
    </AuthScreen>
  );
}
