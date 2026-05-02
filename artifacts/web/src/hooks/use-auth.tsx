import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export type Role = "planner" | "vendor" | "admin" | null;

export interface DbUser {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: "planner" | "vendor" | "admin";
  avatarUrl?: string | null;
}

export function useAuth() {
  const { isSignedIn, isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const {
    data: dbUser,
    isLoading: isDbLoading,
    isError,
    error,
  } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: clerkLoaded && !!isSignedIn,
      retry: false,
    },
  });

  const isNewUser = isError && (error as any)?.status === 404;
  const isLoaded = clerkLoaded && (isSignedIn ? !isDbLoading || isError : true);
  const role: Role = (dbUser as DbUser | undefined)?.role ?? null;

  const logout = async () => {
    await signOut();
  };

  return {
    isSignedIn: !!isSignedIn,
    isLoaded,
    clerkUser,
    dbUser: dbUser as DbUser | undefined,
    role,
    isNewUser,
    logout,
  };
}
