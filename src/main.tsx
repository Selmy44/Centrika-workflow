import { trpc } from "@/lib/trpc";
// Inlined from previously-shared constants
const UNAUTHED_ERR_MSG = 'Please login (10001)';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect to OAuth if already on login page
  const currentPath = window.location.pathname;
  if (currentPath.includes("/login")) {
    return;
  }

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;

    if (error instanceof TRPCClientError && error.message === 'Invalid email or password') {
      // This is a specific login failure, which should be handled by the
      // component's `onError` callback. We can suppress the global error log.
      return;
    }
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = (trpc as any).createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || "/api"}/trpc`,
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const TrpcProvider = (trpc as any).Provider;

createRoot(document.getElementById("root")!).render(
  <TrpcProvider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </TrpcProvider>
);
