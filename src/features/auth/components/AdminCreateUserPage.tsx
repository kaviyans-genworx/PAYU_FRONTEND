import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/useAppStore";
import { adminUserService } from "../services/adminUserService";

const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

export function AdminCreateUserPage() {
  const navigate = useNavigate();
  const { roleId } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleIdInput, setRoleIdInput] = useState<number>(USER_ROLE_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (roleId !== ADMIN_ROLE_ID) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await adminUserService.createUser({
        name: name.trim(),
        email: email.trim(),
        role_id: roleIdInput,
      });

      setSuccess("User created successfully. Credentials were sent to the user email.");
      setName("");
      setEmail("");
      setRoleIdInput(USER_ROLE_ID);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ?? "Failed to create user";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={roleIdInput}
                onChange={(e) => setRoleIdInput(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={ADMIN_ROLE_ID}>Admin</option>
                <option value={USER_ROLE_ID}>User</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/users")}
              >
                Go to User Management
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
