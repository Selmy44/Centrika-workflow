import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]);
export const requestTypeEnum = pgEnum("request_type", ["leave", "car", "expenditure"]);
export const requestStatusEnum = pgEnum("request_status", ["draft", "pending", "approved", "rejected", "cancelled"]);
export const leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "personal", "unpaid"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected", "cancelled"]);
export const approvalLevelEnum = pgEnum("approval_level", ["head_of_department", "hr", "head_of_finance", "ceo_md", "final"]);
export const mfaMethodEnum = pgEnum("mfa_method", ["email", "sms", "totp"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: text("password"),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  additionalRoles: text("additional_roles"),
  department: varchar("department", { length: 255 }),
  position: varchar("position", { length: 255 }),
  staffId: varchar("staff_id", { length: 50 }),
  dateOfEmployment: varchar("date_of_employment", { length: 10 }),
  managerId: integer("manager_id"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const requests = pgTable("requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: requestTypeEnum("type").notNull(),
  status: requestStatusEnum("status").default("draft").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  currentApprovalLevel: approvalLevelEnum("current_approval_level").default("head_of_department").notNull(),
  initialApproverId: integer("initial_approver_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

export const leaveRequests = pgTable("leave_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  leaveDaysRequested: integer("leave_days_requested"),
  leaveDaysEntitled: integer("leave_days_entitled"),
  leaveDaysTaken: integer("leave_days_taken"),
  leaveDaysRemaining: integer("leave_days_remaining"),
  employeeSignatureFileId: integer("employee_signature_file_id").references(() => requestAttachments.id).default(null),
  managerSignatureFileId: integer("manager_signature_file_id").references(() => requestAttachments.id).default(null),
  backupPersonName: varchar("backup_person_name", { length: 255 }),
  backupPersonPhone: varchar("backup_person_phone", { length: 20 }),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

export const carRequests = pgTable("car_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  destination: varchar("destination", { length: 255 }).notNull(),
  purpose: text("purpose"),
  departureDate: varchar("departure_date", { length: 10 }).notNull(),
  departureTime: varchar("departure_time", { length: 5 }),
  passengers: integer("passengers").default(1).notNull(),
  driverName: varchar("driver_name", { length: 255 }),
  carInfo: varchar("car_info", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CarRequest = typeof carRequests.$inferSelect;
export type InsertCarRequest = typeof carRequests.$inferInsert;

export const expenditureRequests = pgTable("expenditure_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("RWF").notNull(),
  department: varchar("department", { length: 255 }),
  category: varchar("category", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpenditureRequest = typeof expenditureRequests.$inferSelect;
export type InsertExpenditureRequest = typeof expenditureRequests.$inferInsert;

export const requestApprovals = pgTable("request_approvals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  approverId: integer("approver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  approvalLevel: approvalLevelEnum("approval_level").notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  comments: text("comments"),
  signatureFileId: integer("signature_file_id").references(() => requestAttachments.id),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RequestApproval = typeof requestApprovals.$inferSelect;
export type InsertRequestApproval = typeof requestApprovals.$inferInsert;

export const attachmentTypeEnum = pgEnum("attachment_type", [
  "employee_signature",
  "manager_signature",
  "hr_signature",
  "ceo_signature",
  "supporting_document",
]);

export const requestAttachments = pgTable("request_attachments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  type: attachmentTypeEnum("type").default("supporting_document"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RequestAttachment = typeof requestAttachments.$inferSelect;
export type InsertRequestAttachment = typeof requestAttachments.$inferInsert;

export const leaveBalances = pgTable("leave_balances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  annualLeaveEntitled: integer("annual_leave_entitled").default(18).notNull(),
  annualLeaveCarryover: integer("annual_leave_carryover").default(0).notNull(),
  annualLeaveTaken: integer("annual_leave_taken").default(0).notNull(),
  annualLeaveRemaining: integer("annual_leave_remaining").default(18).notNull(),
  sickLeave: integer("sick_leave").default(10).notNull(),
  personalLeave: integer("personal_leave").default(3).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export const notificationTypeEnum = pgEnum("notification_type", [
  "request_submitted",
  "request_approved",
  "request_rejected",
  "approval_needed",
  "approval_completed",
]);

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  triggeredByUserId: integer("triggered_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const formSubmissions = pgTable("form_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().unique().references(() => requests.id, { onDelete: "cascade" }),
  formData: text("form_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

export const mfaMethods = pgTable("mfa_methods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  method: mfaMethodEnum("method").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  backupCodes: text("backup_codes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MfaMethod = typeof mfaMethods.$inferSelect;
export type InsertMfaMethod = typeof mfaMethods.$inferInsert;

export const otpTokens = pgTable("otp_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  method: mfaMethodEnum("method").notNull(),
  destination: varchar("destination", { length: 320 }),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OtpToken = typeof otpTokens.$inferSelect;
export type InsertOtpToken = typeof otpTokens.$inferInsert;

export const magicLinks = pgTable("magic_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = typeof magicLinks.$inferInsert;

export const mfaSessions = pgTable("mfa_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  loginMethod: varchar("login_method", { length: 64 }).notNull(),
  isMfaVerified: boolean("is_mfa_verified").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MfaSession = typeof mfaSessions.$inferSelect;
export type InsertMfaSession = typeof mfaSessions.$inferInsert;

export const invitations = pgTable("invitations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  role: roleEnum("role").default("user").notNull(),
  name: text("name"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
