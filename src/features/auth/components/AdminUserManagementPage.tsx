import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/hooks/useAppStore";
import { usePagination } from "@/hooks/usePagination";
import type { AdminUser } from "@/types/auth";
import { adminUserService } from "../services/adminUserService";

const ADMIN_ROLE_ID = 1;
const PAGE_SIZE = 8;

export function AdminUserManagementPage() {
  const navigate = useNavigate();
  const { roleId } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.user_id - b.user_id),
    [users],
  );

  const {
    currentPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(sortedUsers, PAGE_SIZE);

  if (roleId !== ADMIN_ROLE_ID) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadUsers = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await adminUserService.listUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ?? "Failed to load users";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleUserActive = async (user: AdminUser) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await adminUserService.updateUser(user.user_id, {
        is_active: !user.is_active,
      });
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ?? "Failed to update user status";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button onClick={() => navigate("/admin/users/create")}>Create User</Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading users...</div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">First Login</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((user) => {
                      return (
                        <tr key={user.user_id} className="border-b">
                          <td className="px-3 py-2">{user.user_id}</td>
                          <td className="px-3 py-2">{user.name}</td>
                          <td className="px-3 py-2">{user.email}</td>
                          <td className="px-3 py-2">{user.role_name ?? user.role_id}</td>
                          <td className="px-3 py-2">
                            {user.is_active ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {user.is_first_login ? (
                              <Badge variant="secondary">Pending</Badge>
                            ) : (
                              <Badge>Completed</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void toggleUserActive(user)}
                              disabled={isSubmitting}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={nextPage}
                onPrevPage={prevPage}
                onGoToPage={goToPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
