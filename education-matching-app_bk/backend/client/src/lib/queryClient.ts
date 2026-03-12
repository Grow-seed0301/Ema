import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Standard API response format from the backend
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Type guard to check if a response follows the standard API format
 */
function isStandardApiResponse<T>(json: unknown): json is ApiResponse<T> {
  return (
    json !== null &&
    typeof json === 'object' &&
    'success' in json &&
    typeof (json as ApiResponse<T>).success === 'boolean' &&
    'data' in json
  );
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  },
): Promise<Response> {
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey
    // First element is the path, second element (if exists and is an object) contains query params
    let url = queryKey[0] as string;
    
    if (queryKey.length > 1 && typeof queryKey[1] === "object" && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as QueryParams;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        // Include all values except undefined and null
        // Empty strings and 0 are valid query parameter values
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    
    // Unwrap the standard API response format { success: true, data: T }
    // Only unwrap if it's a successful response
    if (isStandardApiResponse<T>(json) && json.success) {
      return json.data as T;
    }
    
    return json;
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
