import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const policiesRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.policy.findMany({
      orderBy: { category: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const policy = await prisma.policy.findUnique({
        where: { id: input.id },
      });
      if (!policy) throw new TRPCError({ code: "NOT_FOUND" });
      return policy;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only HR or Admin can create policies
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR or Admin can manage policies",
        });
      }

      return prisma.policy.create({
        data: {
          title: input.title,
          category: input.category,
          content: input.content,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR or Admin can manage policies",
        });
      }

      const { id, ...data } = input;
      return prisma.policy.update({
        where: { id },
        data: {
          ...data,
          lastUpdated: new Date(),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR or Admin can manage policies",
        });
      }

      await prisma.policy.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
