import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, requests, leaveRequests, carRequests, expenditureRequests, requestApprovals, requestAttachments, leaveBalances } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all requests for a user
 */
export async function getUserRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requests).where(eq(requests.userId, userId));
}

/**
 * Get pending approval requests for a manager
 */
export async function getPendingApprovals(approverId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(requestApprovals)
    .where(eq(requestApprovals.approverId, approverId));
}

/**
 * Get request details with related data
 */
export async function getRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get leave request details
 */
export async function getLeaveRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get car request details
 */
export async function getCarRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(carRequests).where(eq(carRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get expenditure request details
 */
export async function getExpenditureRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(expenditureRequests).where(eq(expenditureRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get request attachments
 */
export async function getRequestAttachments(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requestAttachments).where(eq(requestAttachments.requestId, requestId));
}

/**
 * Get user leave balance
 */
export async function getUserLeaveBalance(userId: number, year: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(leaveBalances)
    .where(and(eq(leaveBalances.userId, userId), eq(leaveBalances.year, year)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get request approvals
 */
export async function getRequestApprovals(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requestApprovals).where(eq(requestApprovals.requestId, requestId));
}
