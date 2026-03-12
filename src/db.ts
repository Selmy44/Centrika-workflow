import { PrismaClient, Prisma } from "@prisma/client";

export type User = Prisma.UserGetPayload<{ include: { department: true } }>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully via Prisma");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function getDb() {
  return prisma;
}

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    const data = {
      openId: user.openId,
      name: user.name,
      email: user.email,
      password: user.password,
      loginMethod: user.loginMethod,
      role: user.role || "user",
      position: user.position,
      staffId: user.staffId,
      dateOfEmployment: user.dateOfEmployment,
      departmentId: user.departmentId,
      phoneNumber: user.phoneNumber,
      location: user.location,
      status: user.status,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    await prisma.user.upsert({
      where: { openId: user.openId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: data,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  return prisma.user.findUnique({
    where: { openId },
    include: { department: true }
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    include: { department: true }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email },
    include: { department: true }
  });
}

export async function getUserRequests(userId: number) {
  return prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getPendingApprovals() {
  return prisma.requestApproval.findMany({
    where: { status: "pending" },
    include: { request: true }
  });
}

export async function getRequestDetails(requestId: number) {
  return prisma.request.findUnique({
    where: { id: requestId },
    include: {
      user: true,
      leaveRequest: true,
      carRequest: true,
      expenditureRequest: true,
      assetRequest: true,
      attachments: true,
      approvals: {
        include: { approver: true }
      }
    }
  });
}

export async function getLeaveRequestDetails(requestId: number) {
  return prisma.leaveRequest.findUnique({
    where: { requestId }
  });
}

export async function getCarRequestDetails(requestId: number) {
  return prisma.carRequest.findUnique({
    where: { requestId }
  });
}

export async function getExpenditureRequestDetails(requestId: number) {
  return prisma.expenditureRequest.findUnique({
    where: { requestId }
  });
}

export async function getRequestAttachments(requestId: number) {
  return prisma.requestAttachment.findMany({
    where: { requestId }
  });
}

export async function getUserLeaveBalance(userId: number, year: number) {
  return prisma.leaveBalance.findFirst({
    where: { userId, year }
  });
}

export async function getRequestApprovals(requestId: number) {
  return prisma.requestApproval.findMany({
    where: { requestId },
    include: { approver: true }
  });
}
