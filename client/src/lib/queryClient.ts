import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authService } from "./auth";

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add Firebase auth token
  try {
    const token = await authService.getCurrentUserToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Auth token retrieved successfully");
    } else {
      console.warn("No auth token available");
    }
  } catch (error) {
    console.error("Failed to get auth token:", error);
    throw error;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Firebase auth token
    try {
      const token = await authService.getCurrentUserToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to get auth token for query:", error);
    }

    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
