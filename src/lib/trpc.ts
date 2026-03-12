import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../oneportal-backend/src/router";

export const trpc = createTRPCReact<AppRouter>();
