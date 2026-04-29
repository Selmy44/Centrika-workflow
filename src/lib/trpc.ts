import { createTRPCReact } from "@trpc/react-query";

// TODO: restore full type safety once the backend is co-located.
// The backend router also has a reserved-name collision (a procedure named
// `useContext`, `useUtils`, or `Provider`) that must be renamed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>();
