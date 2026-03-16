import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      departmentId: z.number().optional(),
      role: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];

      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view employee directory",
        });
      }

      try {
        const employees = await prisma.user.findMany({
          where: {
            AND: [
              input.search ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" } },
                  { email: { contains: input.search, mode: "insensitive" } },
                ]
              } : {},
              input.departmentId ? { departmentId: input.departmentId } : {},
              input.role ? { role: input.role as any } : {},
            ]
          },
          include: {
            department: true,
          },
          orderBy: { name: "asc" }
        });

        return employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department?.name,
          departmentId: emp.departmentId,
          position: emp.position,
          staffId: emp.staffId,
          role: emp.role,
          profileImage: emp.profileImage,
          phoneNumber: (emp as any).phoneNumber,
          location: (emp as any).location,
          status: (emp as any).status,
          // @ts-ignore - resolve stale IDE Prisma type cache
          dateOfBirth: emp.dateOfBirth,
          // @ts-ignore - resolve stale IDE Prisma type cache
          contractType: emp.contractType,
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

      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view employee details",
        });
      }

      try {
        const employee = await prisma.user.findUnique({
          where: { id: input.employeeId },
          include: {
            department: true,
            requests: {
              include: {
                leaveRequest: true,
              }
            },
          }
        });

        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employee not found",
          });
        }

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department?.name,
          departmentId: employee.departmentId,
          position: employee.position,
          staffId: employee.staffId,
          role: employee.role,
          dateOfEmployment: employee.dateOfEmployment,
          profileImage: employee.profileImage,
          phoneNumber: employee.phoneNumber,
          location: (employee as any).location,
          status: (employee as any).status,
          // @ts-ignore - resolve stale IDE Prisma type cache
          dateOfBirth: employee.dateOfBirth,
          // @ts-ignore - resolve stale IDE Prisma type cache
          jobDescription: employee.jobDescription,
          // @ts-ignore - resolve stale IDE Prisma type cache
          contractType: employee.contractType,
          // @ts-ignore - resolve stale IDE Prisma type cache
          contractStart: employee.contractStart,
          // @ts-ignore - resolve stale IDE Prisma type cache
          contractEnd: employee.contractEnd,
          leaveHistory: employee.requests
            .filter(r => r.type === "leave" && r.leaveRequest)
            .map(r => r.leaveRequest),
          requestsCount: employee.requests.length,
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
    try {
      return prisma.department.findMany({
        orderBy: { name: "asc" }
      });
    } catch (error) {
      console.error("[employees.getDepartments] Error fetching departments:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch departments",
      });
    }
  }),

  createDepartment: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      hodId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "ceo_md"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage departments",
        });
      }

      try {
        return await prisma.department.create({
          data: {
            name: input.name,
            description: input.description,
            hodId: input.hodId,
          },
        });
      } catch (error) {
        console.error("[employees.createDepartment] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create department",
        });
      }
    }),

  updateDepartment: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      hodId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "ceo_md"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage departments",
        });
      }

      try {
        const { id, ...data } = input;
        return await prisma.department.update({
          where: { id },
          data,
        });
      } catch (error) {
        console.error("[employees.updateDepartment] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update department",
        });
      }
    }),

  deleteDepartment: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "ceo_md"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete departments",
        });
      }

      try {
        // Check if department has users
        const userCount = await prisma.user.count({
          where: { departmentId: input.id }
        });

        if (userCount > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Cannot delete department with active employees. Reassign employees first.",
          });
        }

        return await prisma.department.delete({
          where: { id: input.id },
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[employees.deleteDepartment] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete department",
        });
      }
    }),
});
