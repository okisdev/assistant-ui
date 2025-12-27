import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/error";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw ApiError.unauthorized();
  }
  return user;
}

export function unauthorizedResponse() {
  return ApiError.unauthorized().toResponse();
}
