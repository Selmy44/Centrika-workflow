import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const suggestionsRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        isAnonymous: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.suggestion.create({
        data: {
          content: input.content,
          isAnonymous: input.isAnonymous,
          userId: input.isAnonymous ? null : ctx.user.id,
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Only Admin or Management can view suggestions
    const allowedRoles = ["admin", "hr", "ceo_md", "head_of_department", "head_of_finance"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view suggestions",
      });
    }

    return prisma.suggestion.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
