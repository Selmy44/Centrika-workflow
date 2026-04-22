import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = router({
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const requests = await prisma.request.findMany({
      where: { userId: ctx.user.id, NOT: { status: { in: ["draft", "cancelled"] } } },
      orderBy: { createdAt: "desc" },
    });

    const completed = requests.filter(
      (r) => r.status === "approved" || r.status === "rejected"
    );

    const avgProcessingTime =
      completed.length > 0
        ? completed.reduce(
            (acc, r) => acc + (r.updatedAt.getTime() - r.createdAt.getTime()),
            0
          ) / completed.length / (1000 * 60 * 60)
        : 0;

    // Monthly trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.request.groupBy({
      by: ["type", "status"],
      _count: { id: true },
      where: {
        userId: ctx.user.id,
        createdAt: { gte: sixMonthsAgo },
        NOT: { status: { in: ["draft", "cancelled"] } },
      },
    });

    return {
      total: requests.length,
      approved: requests.filter((r) => r.status === "approved").length,
      pending: requests.filter((r) => r.status === "pending").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      avgProcessingTimeHours: Math.round(avgProcessingTime * 10) / 10,
      monthlyTrends: monthlyData,
    };
  }),

  getSystemSLA: protectedProcedure.query(async ({ ctx }) => {
    // Only management can see system-wide SLAs
    const allowedRoles = ["admin", "hr", "ceo_md", "head_of_department", "head_of_finance"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const completedRequests = await prisma.request.findMany({
      where: { status: { in: ["approved", "rejected"] } },
      select: {
        id: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { department: { select: { name: true } } } },
      },
    });

    const statsByType = completedRequests.reduce((acc: any, r) => {
      const duration = (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
      if (!acc[r.type]) acc[r.type] = { count: 0, totalDuration: 0 };
      acc[r.type].count++;
      acc[r.type].totalDuration += duration;
      return acc;
    }, {});

    const slaByType = Object.keys(statsByType).map((type) => ({
      type,
      avgHours: Math.round((statsByType[type].totalDuration / statsByType[type].count) * 10) / 10,
      count: statsByType[type].count,
    }));

    return {
      slaByType,
      totalCompleted: completedRequests.length,
    };
  }),
});
