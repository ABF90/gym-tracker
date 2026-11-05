import { AuthScreen } from "@/features/auth/login-form";
import { ResetPasswordForm } from "@/features/auth/password-reset";

export default function ResetPasswordPage() {
  return (
    <AuthScreen>
      <ResetPasswordForm />
    </AuthScreen>
  );
}
