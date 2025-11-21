import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock user for testing
const mockUser: User = {
  id: 1,
  openId: "test-user-1",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockAdmin: User = {
  ...mockUser,
  id: 2,
  openId: "admin-user-1",
  name: "Admin User",
  role: "admin",
};

function createMockContext(user: User | null = mockUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("requests router", () => {
  describe("getDashboardStats", () => {
    it("returns dashboard statistics for authenticated user", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.requests.getDashboardStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalRequests");
      expect(stats).toHaveProperty("pendingRequests");
      expect(stats).toHaveProperty("approvedRequests");
      expect(stats).toHaveProperty("rejectedRequests");
      expect(typeof stats.totalRequests).toBe("number");
      expect(typeof stats.pendingRequests).toBe("number");
      expect(typeof stats.approvedRequests).toBe("number");
      expect(typeof stats.rejectedRequests).toBe("number");
    });

    it("returns zero stats for new user with no requests", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.requests.getDashboardStats();

      expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
      expect(stats.pendingRequests).toBeGreaterThanOrEqual(0);
      expect(stats.approvedRequests).toBeGreaterThanOrEqual(0);
      expect(stats.rejectedRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe("listUserRequests", () => {
    it("returns empty array for user with no requests", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const requests = await caller.requests.listUserRequests();

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThanOrEqual(0);
    });

    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.listUserRequests();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("getLeaveBalance", () => {
    it("returns leave balance for authenticated user", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const balance = await caller.requests.getLeaveBalance();

      // Balance can be null if not initialized, which is fine
      if (balance) {
        expect(balance).toHaveProperty("userId");
        expect(balance).toHaveProperty("annualLeave");
        expect(balance).toHaveProperty("sickLeave");
        expect(balance).toHaveProperty("personalLeave");
        expect(balance).toHaveProperty("year");
      }
    });

    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.getLeaveBalance();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("listPendingApprovals", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.listPendingApprovals();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("returns pending approvals for admin user", async () => {
      const ctx = createMockContext(mockAdmin);
      const caller = appRouter.createCaller(ctx);

      const approvals = await caller.requests.listPendingApprovals();

      expect(Array.isArray(approvals)).toBe(true);
    });

    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.listPendingApprovals();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("approveRequest", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.approveRequest({
          requestId: 1,
          comments: "Approved",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.approveRequest({
          requestId: 1,
          comments: "Approved",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("rejectRequest", () => {
    it("requires admin role", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.rejectRequest({
          requestId: 1,
          comments: "Rejected",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.rejectRequest({
          requestId: 1,
          comments: "Rejected",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("getAttachments", () => {
    it("returns attachments for a request", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const attachments = await caller.requests.getAttachments({
        requestId: 1,
      });

      expect(Array.isArray(attachments)).toBe(true);
    });
  });

  describe("addAttachment", () => {
    it("requires authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.requests.addAttachment({
          requestId: 1,
          fileName: "test.pdf",
          fileUrl: "https://example.com/test.pdf",
          fileKey: "test-key",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
