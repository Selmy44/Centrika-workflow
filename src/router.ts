import { COOKIE_NAME } from "./shared/const";
import { getSessionCookieOptions } from "./core/cookies";
import { publicProcedure, router, protectedProcedure } from "./core/trpc";
import { requestsRouter } from "./routers/requests";
import { notificationsRouter } from "./routers/notifications";
import { mfaRouter } from "./routers/mfa";
import { employeesRouter } from "./routers/employees";
import { invitationsRouter } from "./routers/invitations";
import { upsertUser, getDb } from "./db";
import { SignJWT } from "jose";
import { ENV } from "./core/env";
import { eq, inArray, or, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, emailTemplates } from "./core/email";
import { sendOtp, verifyOtp } from "./core/otp";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    signUp: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        department: z.string().min(1, "Department is required"),
        position: z.string().min(1, "Position is required"),
        staffId: z.string().min(1, "Staff ID is required"),
        dateOfEmployment: z.string().min(1, "Date of employment is required"),
        managerId: z.number().min(1, "Line manager is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Validate that email is a company email (@centrika.rw domain)
        if (!input.email.endsWith("@centrika.rw")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must use a company email address (username@centrika.rw)"
          });
        }

        const existingUser = await db.select().from(users).where(eq(users.email, input.email));
        if (existingUser.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        const managerExists = await db.select().from(users).where(eq(users.id, input.managerId));
        if (managerExists.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selected line manager does not exist" });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        const openId = `email-${crypto.randomBytes(16).toString("hex")}`;

        const newUser = {
          openId,
          email: input.email,
          name: input.name,
          password: hashedPassword,
          loginMethod: "email",
          role: "user", // All new signups are regular users by default
          department: input.department,
          position: input.position,
          staffId: input.staffId,
          dateOfEmployment: input.dateOfEmployment,
          managerId: input.managerId,
          lastSignedIn: new Date(),
        };

        try {
          await upsertUser(newUser as any);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        const welcomeEmail = emailTemplates.welcomeEmail(input.name, input.email);
        await sendEmail(input.email, welcomeEmail.subject, welcomeEmail.html);

        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({
          openId: newUser.openId,
          appId: ENV.appId,
          name: newUser.name,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secret);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: {
            id: openId,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        };
      }),

    // User login with email/password - sends OTP
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Invalid password"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const dbUsers = await db.select().from(users).where(eq(users.email, input.email));
        if (dbUsers.length === 0 || !dbUsers[0].password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const user = dbUsers[0];

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
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const dbUsers = await db.select().from(users).where(eq(users.email, input.email));
        if (dbUsers.length === 0) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
        }

        const user = dbUsers[0];

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

        await db
          .update(users)
          .set({ lastSignedIn: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));

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
          department: role === "head_of_department" ? "Engineering" : undefined,
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
        department: z.string().optional(),
        position: z.string().optional(),
        staffId: z.string().optional(),
        dateOfEmployment: z.string().optional(),
        managerId: z.number().optional(),
        profileImage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // If email is being changed, check it's not already in use by someone else
        if (input.email && input.email !== ctx.user.email) {
          const existing = await db.select().from(users).where(eq(users.email, input.email));
          if (existing.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "Email is already in use" });
          }
        }

        await db
          .update(users)
          .set({
            name: input.name,
            email: input.email,
            department: input.department,
            position: input.position,
            staffId: input.staffId,
            dateOfEmployment: input.dateOfEmployment,
            managerId: input.managerId,
            profileImage: input.profileImage,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        const updatedUser = await db.select().from(users).where(eq(users.id, ctx.user.id));

        return {
          success: true,
          user: updatedUser[0],
        };
      }),

    // Change password (only for email/password users)
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(6, "Password must be at least 6 characters"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        if (ctx.user.loginMethod !== "email") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only email/password users can change passwords" });
        }

        const userWithPassword = await db.select().from(users).where(eq(users.id, ctx.user.id));
        if (userWithPassword.length === 0 || !userWithPassword[0].password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found or has no password" });
        }

        const isPasswordValid = await bcrypt.compare(input.currentPassword, userWithPassword[0].password);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        const passwordChangedEmail = emailTemplates.passwordChangedEmail(userWithPassword[0].name || "User");
        await sendEmail(userWithPassword[0].email || "", passwordChangedEmail.subject, passwordChangedEmail.html);

        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .input(z.object({
        password: z.string().min(1, "Password required to delete account"),
        confirm: z.boolean().refine(val => val === true, "Must confirm account deletion"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        if (ctx.user.loginMethod === "email") {
          const userWithPassword = await db.select().from(users).where(eq(users.id, ctx.user.id));
          if (userWithPassword.length === 0 || !userWithPassword[0].password) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
          }

          const isPasswordValid = await bcrypt.compare(input.password, userWithPassword[0].password);
          if (!isPasswordValid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect" });
          }
        }

        try {
          await db.update(users)
            .set({ managerId: null })
            .where(eq(users.managerId, ctx.user.id));

          await db.delete(users).where(eq(users.id, ctx.user.id));
        } catch (error) {
          console.error("[deleteAccount] Error deleting user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete account: " + (error instanceof Error ? error.message : "Unknown error"),
          });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

        return { success: true };
      }),

    // Request password reset
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const user = await db.select().from(users).where(eq(users.email, input.email));

        if (user.length === 0 || !user[0].password) {
          return { success: true, message: "If email exists, you will receive reset instructions" };
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save token to database
        await db.insert(passwordResetTokens).values({
          userId: user[0].id,
          token: resetToken,
          expiresAt,
        });

        const resetLink = `${ENV.appUrl}/reset-password?token=${resetToken}`;

        const resetEmail = emailTemplates.passwordResetEmail(user[0].name || "User", resetLink);
        await sendEmail(input.email, resetEmail.subject, resetEmail.html);

        return { success: true, message: "If email exists, you will receive reset instructions" };
      }),

    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Reset token required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const resetToken = await db
          .select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, input.token));

        if (resetToken.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset token" });
        }

        const token = resetToken[0];

        if (new Date() > token.expiresAt) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Reset token has expired" });
        }

        if (token.usedAt) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Reset token has already been used" });
        }

        const userData = await db.select().from(users).where(eq(users.id, token.userId));
        if (userData.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, token.userId));

        await db
          .update(passwordResetTokens)
          .set({
            usedAt: new Date(),
          })
          .where(eq(passwordResetTokens.id, token.id));

        const confirmEmail = emailTemplates.passwordChangedEmail(userData[0].name || "User");
        await sendEmail(userData[0].email || "", confirmEmail.subject, confirmEmail.html);

        return { success: true, message: "Password reset successfully" };
      }),
  }),

  requests: requestsRouter,
  notifications: notificationsRouter,
  invitations: invitationsRouter,

  users: router({
    listHeads: publicProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      try {
        const headsResult = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          department: users.department,
        }).from(users).where(
          or(
            eq(users.role, "head_of_department"),
            ilike(users.additionalRoles, "%head_of_department%")
          )
        ).orderBy(users.name);

        // Simple deduplication: keep only first occurrence per department
        const seen = new Set<string>();
        const uniqueHeads = headsResult.filter(h => {
          const deptKey = (h.department || "__NO_DEPT__").trim().toLowerCase();
          if (seen.has(deptKey)) return false;
          seen.add(deptKey);
          return true;
        });

        return uniqueHeads;
      } catch (error) {
        console.error("[users.listHeads] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch heads" });
      }
    }),

    getHRUsers: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const hrUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }).from(users).where(
        or(
          eq(users.role, "hr"),
          ilike(users.additionalRoles, "%hr%")
        )
      );

      // Sort alphabetically by name
      return hrUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all users" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      return db.select().from(users);
    }),

    updateUser: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]),
          department: z.string().optional(),
          managerId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update users" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        await db
          .update(users)
          .set({
            role: input.role,
            department: input.department,
            managerId: input.managerId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        return { success: true };
      }),

    assignRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only superadmin can assign roles" });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const targetUser = await db.select().from(users).where(eq(users.id, input.userId));
        if (targetUser.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        await db
          .update(users)
          .set({
            role: input.role,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          user: {
            id: targetUser[0].id,
            email: targetUser[0].email,
            name: targetUser[0].name,
            role: input.role,
          },
        };
      }),

    // Admin function to reset user password
    resetUserPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters")
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can reset passwords" });
        }

        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Use the regular password change endpoint for your own password" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        const result = await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, input.userId))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        return { success: true, message: `Password reset for ${result[0].name}` };
      }),

    // User change their own password
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters")
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const user = await db.select().from(users).where(eq(users.id, ctx.user.id));

        if (user.length === 0 || !user[0].password) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(input.currentPassword, user[0].password);

        if (!isPasswordCorrect) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, ctx.user.id));

        return { success: true, message: "Password changed successfully" };
      }),

    // Admin create user
    createUser: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          department: z.string().optional(),
          position: z.string().optional(),
          staffId: z.string().optional(),
          role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]).optional(),
          dateOfEmployment: z.string().optional(),
          managerId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Only admins or HR can create users
        if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and HR can create users" });
        }

        // Validate email is company email
        if (!input.email.endsWith("@centrika.rw")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must use a company email address (username@centrika.rw)"
          });
        }

        // Check if email already exists
        const existingUser = await db.select().from(users).where(eq(users.email, input.email));
        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email already exists in the system"
          });
        }

        // Generate a unique openId
        const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Generate a temporary password (12 chars mix of uppercase, lowercase, numbers, special chars)
        const tempPassword = Math.random().toString(36).slice(-12) + "Temp@1";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        try {
          const newUser: InsertUser = {
            openId: openId,
            name: input.name,
            email: input.email,
            password: hashedPassword,
            loginMethod: "email",
            role: input.role || "user",
            department: input.department,
            position: input.position,
            staffId: input.staffId,
            dateOfEmployment: input.dateOfEmployment,
            managerId: input.managerId,
          };

          const result = await db.insert(users).values(newUser).returning({ id: users.id, email: users.email });

          // TODO: Send welcome email with temporary password
          console.log(`[createUser] New user created - Email: ${input.email}, Temp Password: ${tempPassword}`);

          return {
            success: true,
            userId: result[0].id,
            email: result[0].email,
            message: `User created successfully. Temporary password: ${tempPassword}`
          };
        } catch (error) {
          console.error("[createUser] Error creating user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }),

    // Admin delete user
    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete users" });
        }

        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
        }

        const userToDelete = await db.select().from(users).where(eq(users.id, input.userId));

        if (userToDelete.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        try {
          await db.update(users)
            .set({ managerId: null })
            .where(eq(users.managerId, input.userId));

          await db.delete(users).where(eq(users.id, input.userId));
        } catch (error) {
          console.error("[deleteUser] Error deleting user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }

        return { success: true, message: `User ${userToDelete[0].name} has been deleted` };
      }),
  }),
  employees: employeesRouter,
  mfa: mfaRouter,
});

export type AppRouter = typeof appRouter;
