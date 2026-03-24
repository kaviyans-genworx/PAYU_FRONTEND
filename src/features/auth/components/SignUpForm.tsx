import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

export function SignUpForm() {
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
            <CardTitle className="text-xl">Sign up unavailable</CardTitle>
            <CardDescription>Accounts are provisioned by administrators only.</CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Please contact your administrator to create your account.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} PAYU. Secure accounts payable processing.
        </p>
      </div>
    </div>
  );
}
