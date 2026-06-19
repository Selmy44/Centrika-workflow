import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const workflowRouter = router({
    getConfigs: protectedProcedure.query(async () => {
        return prisma.workflowConfig.findMany();
    }),

    getConfigByRequestType: protectedProcedure
        .input(z.object({ requestType: z.string() }))
        .query(async ({ input }) => {
            const config = await prisma.workflowConfig.findFirst({
                where: { requestType: input.requestType as any },
                include: {
                    steps: {
                        orderBy: { stepOrder: "asc" },
                        include: {
                            escalationRules: true,
                        },
                    },
                },
            });

            return config;
        }),
});
