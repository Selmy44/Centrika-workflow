import { protectedProcedure, router } from "../core/trpc";
import { getDb } from "../db";
import { users, leaveRequests, requests } from "../../drizzle/schema";
import { eq, ilike, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      department: z.string().optional(),
      role: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];

      if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view employee directory",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        let query = db.select().from(users);

        const filters = [];

        if (input.search) {
          filters.push(
            ilike(users.name, `%${input.search}%`)
          );
        }

        if (input.department) {
          filters.push(eq(users.department, input.department));
        }

        if (input.role) {
          filters.push(eq(users.role, input.role as any));
        }

        // Apply filters
        if (filters.length > 0) {
          query = query.where(and(...filters));
        }

        const employeeList = await query;
        return employeeList.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          staffId: emp.staffId,
          role: emp.role,
          profileImage: emp.profileImage,
        }));
      } catch (error) {
        console.error("[employees.list] Error fetching employees:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch employees",
        });
      }
    }),

  getDetail: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];

      if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view employee details",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        const employee = await db
          .select()
          .from(users)
          .where(eq(users.id, input.employeeId))
          .limit(1);

        if (!employee || employee.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employee not found",
          });
        }

        const emp = employee[0];

        const employeeRequests = await db
          .select()
          .from(requests)
          .where(eq(requests.userId, input.employeeId));

        const leaveReqs = await db
          .select()
          .from(leaveRequests)
          .where(
            and(
              ...employeeRequests
                .map(req => eq(leaveRequests.requestId, req.id))
                .reduce((acc, filter, idx) => {
                  if (idx === 0) return [filter];
                  return acc;
                }, [] as any[])
            )
          );

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          staffId: emp.staffId,
          role: emp.role,
          dateOfEmployment: emp.dateOfEmployment,
          profileImage: emp.profileImage,
          leaveHistory: leaveReqs,
          requestsCount: employeeRequests.length,
        };
      } catch (error) {
        console.error("[employees.getDetail] Error fetching employee details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch employee details",
        });
      }
    }),

  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];

    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to access this",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      const result = await db
        .select({ department: users.department })
        .from(users)
        .where(and(
          (col) => col.isNotNull(users.department)
        ));

      const departments = Array.from(
        new Set(result.map(r => r.department).filter(Boolean))
      );

      return departments;
    } catch (error) {
      console.error("[employees.getDepartments] Error fetching departments:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch departments",
      });
    }
  }),
});
