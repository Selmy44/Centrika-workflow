import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const financeRouter = router({
  getBudgetStatus: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      year: z.number().default(new Date().getFullYear()),
    }))
    .query(async ({ ctx, input }) => {
      const isFinanceOrAdmin = ["admin", "head_of_finance", "ceo_md"].includes(ctx.user.role);
      const departmentId = input.departmentId || ctx.user.departmentId;

      if (!isFinanceOrAdmin && departmentId !== ctx.user.departmentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this department's budget",
        });
      }

      try {
        const budgets = await prisma.budget.findMany({
          where: {
            year: input.year,
            ...(departmentId ? { departmentId } : {}),
          },
          include: {
            department: true,
            usages: true,
          },
        });

        return budgets.map(budget => {
          const committed = budget.usages
            .filter(u => u.type === "committed")
            .reduce((acc, u) => acc + Number(u.amount), 0);
          const actual = budget.usages
            .filter(u => u.type === "actual")
            .reduce((acc, u) => acc + Number(u.amount), 0);
          
          return {
            ...budget,
            totalAmount: Number(budget.totalAmount),
            committed,
            actual,
            remaining: Number(budget.totalAmount) - actual,
          };
        });
      } catch (error) {
        console.error("[finance.getBudgetStatus] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch budget status",
        });
      }
    }),

  setBudget: protectedProcedure
    .input(z.object({
      departmentId: z.number(),
      year: z.number(),
      totalAmount: z.number(),
      category: z.string().optional(),
      currency: z.string().default("RWF"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "head_of_finance" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Finance or Admin can set budgets",
        });
      }

      try {
        const budget = await prisma.budget.upsert({
          where: {
            departmentId_year_category: {
              departmentId: input.departmentId,
              year: input.year,
              category: input.category || "General",
            },
          },
          update: {
            totalAmount: input.totalAmount,
            currency: input.currency,
          },
          create: {
            departmentId: input.departmentId,
            year: input.year,
            totalAmount: input.totalAmount,
            currency: input.currency,
            category: input.category || "General",
          },
        });

        return { success: true, budget };
      } catch (error) {
        console.error("[finance.setBudget] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set budget",
        });
      }
    }),

  getFinancialOverview: protectedProcedure.query(async ({ ctx }) => {
    if (!["head_of_finance", "admin", "ceo_md"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const approvedExp = await prisma.request.findMany({
        where: { type: "expenditure", status: "approved" },
        include: { expenditureRequest: true },
      });

      const totalSpentRWF = approvedExp.reduce((acc, req) => {
        if (req.expenditureRequest?.currency === "RWF") {
          return acc + (req.expenditureRequest.amount || 0);
        }
        return acc;
      }, 0);

      const pendingApprovals = await prisma.request.count({
        where: { type: "expenditure", status: "pending" },
      });

      // Simple monthly trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrend = await prisma.request.findMany({
        where: {
          type: "expenditure",
          status: "approved",
          createdAt: { gte: sixMonthsAgo },
        },
        include: { expenditureRequest: true },
      });

      return {
        totalSpentRWF,
        pendingApprovals,
        monthlyTrend: monthlyTrend.map(t => ({
          date: t.createdAt,
          amount: t.expenditureRequest?.amount || 0,
        })),
        approvalEfficiency: 85, // Stub for now
      };
    } catch (error) {
      console.error("[finance.getFinancialOverview] Error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  generateVoucher: protectedProcedure
    .input(z.object({
      requestId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "head_of_finance" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const request = await prisma.request.findUnique({
        where: { id: input.requestId },
        include: { expenditureRequest: true },
      });

      if (!request || request.type !== "expenditure" || request.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only approved expenditure requests can have vouchers",
        });
      }

      const voucherNumber = `VCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      try {
        const voucher = await prisma.voucher.create({
          data: {
            requestId: input.requestId,
            voucherNumber,
            amount: request.expenditureRequest?.amount || 0,
            currency: request.expenditureRequest?.currency || "RWF",
            preparedBy: ctx.user.id,
            status: "pending",
          },
        });

        return { success: true, voucher };
      } catch (error) {
        console.error("[finance.generateVoucher] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  listVouchers: protectedProcedure.query(async ({ ctx }) => {
    if (!["head_of_finance", "admin", "ceo_md"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return prisma.voucher.findMany({
      include: {
        request: {
          include: {
            user: true,
            expenditureRequest: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
