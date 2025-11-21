import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Requests table for leave, car, and expenditure requests
 */
export const requests = mysqlTable("requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["leave", "car", "expenditure"]).notNull(),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "cancelled"]).default("draft").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

/**
 * Leave request specific details
 */
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => requests.id),
  leaveType: mysqlEnum("leaveType", ["annual", "sick", "personal", "unpaid"]).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * Car request specific details
 */
export const carRequests = mysqlTable("carRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => requests.id),
  destination: varchar("destination", { length: 255 }).notNull(),
  purpose: text("purpose"),
  departureDate: varchar("departureDate", { length: 10 }).notNull(),
  departureTime: varchar("departureTime", { length: 5 }),
  passengers: int("passengers").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarRequest = typeof carRequests.$inferSelect;
export type InsertCarRequest = typeof carRequests.$inferInsert;

/**
 * Expenditure request specific details
 */
export const expenditureRequests = mysqlTable("expenditureRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => requests.id),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
  department: varchar("department", { length: 255 }),
  category: varchar("category", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExpenditureRequest = typeof expenditureRequests.$inferSelect;
export type InsertExpenditureRequest = typeof expenditureRequests.$inferInsert;

/**
 * Request approvals and workflow tracking
 */
export const requestApprovals = mysqlTable("requestApprovals", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => requests.id),
  approverId: int("approverId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RequestApproval = typeof requestApprovals.$inferSelect;
export type InsertRequestApproval = typeof requestApprovals.$inferInsert;

/**
 * Request attachments for documents and receipts
 */
export const requestAttachments = mysqlTable("requestAttachments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().references(() => requests.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestAttachment = typeof requestAttachments.$inferSelect;
export type InsertRequestAttachment = typeof requestAttachments.$inferInsert;

/**
 * Leave balance tracking for each user
 */
export const leaveBalances = mysqlTable("leaveBalances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  annualLeave: int("annualLeave").default(20).notNull(),
  sickLeave: int("sickLeave").default(10).notNull(),
  personalLeave: int("personalLeave").default(3).notNull(),
  year: int("year").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;