import { AuthScreen } from "@/features/auth/login-form";
import { ForgotPasswordForm } from "@/features/auth/password-reset";

export default function ForgotPage() {
  return (
    <AuthScreen>
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
