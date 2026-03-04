import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, requests, leaveRequests, carRequests, expenditureRequests, requestApprovals, requestAttachments, leaveBalances } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        max: 10,
      });
      _db = drizzle(client);
      console.log("[Database] Connected to PostgreSQL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function connectDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Database] DATABASE_URL not set, will work in local-only mode");
    return null;
  }

  try {
    const client = postgres(url, {
      max: 10,
    });
    _db = drizzle(client);
    console.log("[Database] Connected to PostgreSQL");
    return _db;
  } catch (error) {
    console.error("[Database] Connection error:", error);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name,
      email: user.email,
      password: user.password,
      loginMethod: user.loginMethod,
      role: user.role || "user",
      department: user.department,
      position: user.position,
      staffId: user.staffId,
      dateOfEmployment: user.dateOfEmployment,
      managerId: user.managerId,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    if (existing.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          name: values.name,
          email: values.email,
          password: values.password,
          loginMethod: values.loginMethod,
          department: values.department,
          position: values.position,
          staffId: values.staffId,
          dateOfEmployment: values.dateOfEmployment,
          managerId: values.managerId,
          lastSignedIn: values.lastSignedIn,
          updatedAt: new Date(),
        })
        .where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requests).where(eq(requests.userId, userId));
}

export async function getPendingApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(requestApprovals)
    .where(eq(requestApprovals.status, "pending"));
}

export async function getRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getLeaveRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCarRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(carRequests).where(eq(carRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getExpenditureRequestDetails(requestId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(expenditureRequests).where(eq(expenditureRequests.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRequestAttachments(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requestAttachments).where(eq(requestAttachments.requestId, requestId));
}

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

export async function getRequestApprovals(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(requestApprovals).where(eq(requestApprovals.requestId, requestId));
}
