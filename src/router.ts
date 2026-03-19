import { COOKIE_NAME } from "./shared/const";
import { getSessionCookieOptions } from "./core/cookies";
import { publicProcedure, router, protectedProcedure } from "./core/trpc";
import { requestsRouter } from "./routers/requests";
import { notificationsRouter } from "./routers/notifications";
import { mfaRouter } from "./routers/mfa";
import { employeesRouter } from "./routers/employees";
import { invitationsRouter } from "./routers/invitations";
import { workflowRouter } from "./routers/workflow";
import { commentsRouter } from "./routers/comments";
import { announcementsRouter } from "./routers/announcements";
import { suggestionsRouter } from "./routers/suggestions";
import { policiesRouter } from "./routers/policies";
import { analyticsRouter } from "./routers/analytics";
import { hrRouter } from "./routers/hr";
import { financeRouter } from "./routers/finance";
import { upsertUser, prisma } from "./db";
import { SignJWT } from "jose";
import { ENV } from "./core/env";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "./core/email";
import { sendOtp, verifyOtp } from "./core/otp";
import { z } from "zod";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => ({ status: "ok", timestamp: new Date().toISOString() })),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    registerUser: protectedProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        departmentId: z.number().min(1, "Department is required"),
        position: z.string().min(1, "Position is required"),
        staffId: z.string().optional(),
        dateOfEmployment: z.string().min(1, "Date of employment is required"),
        managerId: z.number().optional(),
        role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]).default("user"),
        dateOfBirth: z.string().optional(),
        jobDescription: z.string().optional(),
        contractType: z.string().optional(),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only HR and Admin can register users
        if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only HR or Admin can register new users"
          });
        }

        // Validate that email is a company email (@centrika.rw domain)
        if (!input.email.endsWith("@centrika.rw")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must use a company email address (username@centrika.rw)"
          });
        }

        const existingUser = await prisma.user.findFirst({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        if (input.managerId) {
          const managerExists = await prisma.user.findUnique({
            where: { id: input.managerId }
          });
          if (!managerExists) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Selected line manager does not exist" });
          }
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const openId = `email-${crypto.randomBytes(16).toString("hex")}`;

        const newUser = await prisma.user.create({
          data: {
            openId,
            email: input.email,
            name: input.name,
            password: hashedPassword,
            loginMethod: "email",
            role: input.role,
            departmentId: input.departmentId,
            position: input.position,
            staffId: input.staffId || "",
            dateOfEmployment: input.dateOfEmployment,
            managerId: input.managerId,
            // @ts-ignore - resolve stale IDE Prisma type cache
            dateOfBirth: input.dateOfBirth,
            jobDescription: input.jobDescription,
            contractType: input.contractType,
            contractStart: input.contractStart,
            contractEnd: input.contractEnd,
            lastSignedIn: new Date(),
          }
        });

        // Generate staffId if not provided: CTK-YYYY-MM-DD ID
        if (!input.staffId) {
          const generatedStaffId = `CTK-${input.dateOfEmployment} ${String(newUser.id).padStart(3, '0')}`;
          await prisma.user.update({
            where: { id: newUser.id },
            data: { staffId: generatedStaffId }
          });
        }

        const welcomeEmail = emailTemplates.welcomeEmail(input.name, input.email);
        await sendEmail(input.email, welcomeEmail.subject, welcomeEmail.html);

        return {
          success: true,
          userId: newUser.id,
        };
      }),

    // User login with email/password - sends OTP
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Invalid password"),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await prisma.user.findFirst({
          where: { email: input.email }
        });

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        if (!user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        // Password is valid - send OTP to email
        if (!user.email) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User email not found" });
        }

        const otpResult = await sendOtp(user.id, "email", user.email);
        if (!otpResult.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send OTP" });
        }

        return {
          success: true,
          message: "OTP sent to your email",
          email: user.email,
        };
      }),

    verifyLoginOtp: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        code: z.string().min(6, "Invalid OTP code"),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await prisma.user.findFirst({
          where: { email: input.email }
        });

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
        }

        const otpResult = await verifyOtp(user.id, input.code, "email");
        if (!otpResult.success) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: otpResult.message || "Invalid or expired OTP" });
        }

        // OTP is valid - generate JWT token
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({
          openId: user.openId,
          appId: ENV.appId,
          name: user.name,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secret);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastSignedIn: new Date(), updatedAt: new Date() }
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            openId: user.openId,
          },
        };
      }),

    devLogin: publicProcedure
      .input(z.object({ role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]) }).optional())
      .mutation(async ({ ctx, input }) => {
        if (ENV.isProduction) {
          throw new Error("Dev login is only available in development");
        }

        const role = input?.role || "user";
        const openId = `dev-${role}-${Date.now()}`;

        const devUser = {
          openId,
          name: `Dev ${role.replace(/_/g, " ").toUpperCase()}`,
          email: `${role}@centrika.local`,
          loginMethod: "dev",
          role: role as "user" | "admin" | "hr" | "head_of_department" | "head_of_finance" | "ceo_md",
          lastSignedIn: new Date(),
        };

        try {
          await upsertUser(devUser);
        } catch (error) {
          // They might already exist, that's fine
        }

        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({
          openId: devUser.openId,
          appId: ENV.appId,
          name: devUser.name
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secret);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        // Set the session cookie so they stay logged in
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: devUser,
        };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email").optional(),
        departmentId: z.number().optional(),
        position: z.string().optional(),
        staffId: z.string().optional(),
        dateOfEmployment: z.string().optional(),
        managerId: z.number().nullable().optional(),
        profileImage: z.string().optional(),
        dateOfBirth: z.string().optional(),
        jobDescription: z.string().optional(),
        contractType: z.string().optional(),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // If email is being changed, check it's not already in use by someone else
        if (input.email && input.email !== ctx.user.email) {
          const existing = await prisma.user.findFirst({
            where: { email: input.email }
          });
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Email is already in use" });
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            name: input.name,
            email: input.email,
            departmentId: input.departmentId,
            position: input.position,
            staffId: input.staffId,
            dateOfEmployment: input.dateOfEmployment,
            managerId: input.managerId,
            profileImage: input.profileImage,
            // @ts-ignore - resolve stale IDE Prisma type cache
            dateOfBirth: input.dateOfBirth,
            jobDescription: input.jobDescription,
            contractType: input.contractType,
            contractStart: input.contractStart,
            contractEnd: input.contractEnd,
            updatedAt: new Date(),
          }
        });

        return {
          success: true,
          user: updatedUser,
        };
      }),

    updateSettings: protectedProcedure
      .input(z.object({
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        dataRetention: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Stub: Just return success for now to fix frontend errors
        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(6, "Password must be at least 6 characters"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.loginMethod !== "email") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only email/password users can change passwords" });
        }

        const userWithPassword = await prisma.user.findUnique({
          where: { id: ctx.user.id }
        });

        if (!userWithPassword || !userWithPassword.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found or has no password" });
        }

        const isPasswordValid = await bcrypt.compare(input.currentPassword, userWithPassword.password);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        await prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          }
        });

        const passwordChangedEmail = emailTemplates.passwordChangedEmail(userWithPassword.name || "User");
        await sendEmail(userWithPassword.email || "", passwordChangedEmail.subject, passwordChangedEmail.html);

        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .input(z.object({
        password: z.string().min(1, "Password required to delete account"),
        confirm: z.boolean().refine(val => val === true, "Must confirm account deletion"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.loginMethod === "email") {
          const userWithPassword = await prisma.user.findUnique({
            where: { id: ctx.user.id }
          });
          if (!userWithPassword || !userWithPassword.password) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
          }

          const isPasswordValid = await bcrypt.compare(input.password, userWithPassword.password);
          if (!isPasswordValid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect" });
          }
        }

        try {
          await prisma.user.updateMany({
            where: { managerId: ctx.user.id },
            data: { managerId: null }
          });

          await prisma.user.delete({
            where: { id: ctx.user.id }
          });
        } catch (error) {
          console.error("[deleteAccount] Error deleting user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete account"
          });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

        return { success: true };
      }),

    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
      }))
      .mutation(async ({ input }) => {
        const user = await prisma.user.findFirst({
          where: { email: input.email }
        });

        if (!user || !user.password) {
          return { success: true, message: "If email exists, you will receive reset instructions" };
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt,
          }
        });

        const resetLink = `${ENV.appUrl}/reset-password?token=${resetToken}`;
        const resetEmail = emailTemplates.passwordResetEmail(user.name || "User", resetLink);
        await sendEmail(input.email, resetEmail.subject, resetEmail.html);

        return { success: true, message: "If email exists, you will receive reset instructions" };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Reset token required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input }) => {
        const resetToken = await prisma.passwordResetToken.findUnique({
          where: { token: input.token },
          include: { user: true }
        });

        if (!resetToken) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset token" });
        }

        if (new Date() > resetToken.expiresAt) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Reset token has expired" });
        }

        if (resetToken.usedAt) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Reset token has already been used" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        await prisma.user.update({
          where: { id: resetToken.userId },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          }
        });

        await prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() }
        });

        const confirmEmail = emailTemplates.passwordChangedEmail(resetToken.user.name || "User");
        await sendEmail(resetToken.user.email || "", confirmEmail.subject, confirmEmail.html);

        return { success: true, message: "Password reset successfully" };
      }),
  }),

  requests: requestsRouter,
  notifications: notificationsRouter,
  invitations: invitationsRouter,
  workflow: workflowRouter,

  users: router({
    listHeads: publicProcedure.query(async () => {
      try {
        const heads = await prisma.user.findMany({
          where: {
            OR: [
              { role: "head_of_department" },
              { additionalRoles: { contains: "head_of_department" } }
            ]
          },
          include: { department: true },
          orderBy: { name: "asc" }
        });

        const seen = new Set<string>();
        return heads.filter((h: any) => {
          const deptKey = (h.department?.name || "__NO_DEPT__").trim().toLowerCase();
          if (seen.has(deptKey)) return false;
          seen.add(deptKey);
          return true;
        });
      } catch (error) {
        console.error("[users.listHeads] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch heads" });
      }
    }),

    getHRUsers: protectedProcedure.query(async () => {
      return prisma.user.findMany({
        where: {
          OR: [
            { role: "hr" },
            { additionalRoles: { contains: "hr" } }
          ]
        },
        orderBy: { name: "asc" }
      });
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all users" });
      }
      return prisma.user.findMany({
        include: { department: true, manager: true } as any
      });
    }),

    createUser: protectedProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        departmentId: z.number().optional(), // Frontend currently sends string 'department', we'll fix that.
        position: z.string().optional(),
        role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]).default("user"),
        dateOfEmployment: z.string().optional(),
        dateOfBirth: z.string().optional(),
        jobDescription: z.string().optional(),
        contractType: z.string().optional(),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins/hr can create users" });
        }

        const existingUser = await prisma.user.findFirst({
          where: { email: input.email }
        });
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already exists" });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const openId = `admin-create-${crypto.randomBytes(16).toString("hex")}`;
        const today = new Date().toISOString().split('T')[0];
        const dateOfEmployment = input.dateOfEmployment || today;

        const newUser = await prisma.user.create({
          data: {
            openId,
            email: input.email,
            name: input.name,
            password: hashedPassword,
            loginMethod: "email",
            role: input.role,
            departmentId: input.departmentId,
            position: input.position || "Staff",
            dateOfEmployment,
            // @ts-ignore - resolve stale IDE Prisma type cache
            dateOfBirth: input.dateOfBirth,
            jobDescription: input.jobDescription,
            contractType: input.contractType,
            contractStart: input.contractStart,
            contractEnd: input.contractEnd,
            staffId: "", // Will be generated below
          }
        });

        const generatedStaffId = `CTK-${dateOfEmployment} ${String(newUser.id).padStart(3, '0')}`;
        await prisma.user.update({
          where: { id: newUser.id },
          data: { staffId: generatedStaffId }
        });

        return {
          success: true,
          message: `User created! Temporary password: ${tempPassword}`,
          user: newUser
        };
      }),

    updateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]),
        departmentId: z.number().optional().nullable(),
        managerId: z.number().optional().nullable(),
        staffId: z.string().optional(),
        position: z.string().optional(),
        dateOfBirth: z.string().optional(),
        jobDescription: z.string().optional(),
        contractType: z.string().optional(),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update users" });
        }

        await prisma.user.update({
          where: { id: input.userId },
          data: {
            role: input.role,
            departmentId: input.departmentId,
            managerId: input.managerId,
            staffId: input.staffId,
            position: input.position,
            // @ts-ignore - resolve stale IDE Prisma type cache
            dateOfBirth: input.dateOfBirth,
            jobDescription: input.jobDescription,
            contractType: input.contractType,
            contractStart: input.contractStart,
            contractEnd: input.contractEnd,
            updatedAt: new Date(),
          }
        });

        return { success: true };
      }),

    assignRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only superadmin can assign roles" });
        }

        const user = await prisma.user.update({
          where: { id: input.userId },
          data: {
            role: input.role,
            updatedAt: new Date(),
          }
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),

    resetUserPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters")
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can reset passwords" });
        }

        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Use the regular password change endpoint" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        const updatedUser = await prisma.user.update({
          where: { id: input.userId },
          data: { password: hashedPassword }
        });

        return { success: true, message: `Password reset for ${updatedUser.name}` };
      }),

    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete users" });
        }

        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
        }

        try {
          await prisma.user.updateMany({
            where: { managerId: input.userId },
            data: { managerId: null }
          });

          const deleted = await prisma.user.delete({
            where: { id: input.userId }
          });

          return { success: true, message: `User ${deleted.name} has been deleted` };
        } catch (error) {
          console.error("[deleteUser] Error deleting user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete user"
          });
        }
      }),
  }),

  employees: employeesRouter,
  mfa: mfaRouter,
  comments: commentsRouter,
  announcements: announcementsRouter,
  suggestions: suggestionsRouter,
  policies: policiesRouter,
  analytics: analyticsRouter,
  hr: hrRouter,
  finance: financeRouter,
});

export type AppRouter = typeof appRouter;
