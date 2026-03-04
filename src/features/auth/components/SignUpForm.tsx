import { useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { registerUser, clearError } from "@/features/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Eye,
  EyeOff,
  UserPlus,
  FileText,
  Check,
  X,
} from "lucide-react";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character (!@#$%^&*)", test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export function SignUpForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );

  const allRulesPassed = ruleResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    allRulesPassed &&
    passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setSuccessMessage("");

    if (!isFormValid) return;

    const result = await dispatch(registerUser({ name, email, password }));

    if (registerUser.fulfilled.match(result)) {
      setSuccessMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground shadow-lg mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            PAYU
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accounts Payable Automation
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-black/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>
              Sign up to get started with PAYU
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error alert */}
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              {/* Success alert */}
              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                  className="h-10"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password strength rules */}
                {password.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {ruleResults.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs ${
                          rule.passed ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        {rule.passed ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 shrink-0" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <X className="h-3 w-3 shrink-0" />
                    Passwords do not match
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3 shrink-0" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-10 mt-2"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size={16} className="text-primary-foreground" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Sign up
                  </>
                )}
              </Button>

              {/* Link to login */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} PAYU. Secure accounts payable processing.
        </p>
      </div>
    </div>
  );
}
