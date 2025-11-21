CREATE TABLE `carRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`destination` varchar(255) NOT NULL,
	`purpose` text,
	`departureDate` varchar(10) NOT NULL,
	`departureTime` varchar(5),
	`passengers` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `carRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenditureRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'RWF',
	`department` varchar(255),
	`category` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenditureRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaveBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`annualLeave` int NOT NULL DEFAULT 20,
	`sickLeave` int NOT NULL DEFAULT 10,
	`personalLeave` int NOT NULL DEFAULT 3,
	`year` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaveBalances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`leaveType` enum('annual','sick','personal','unpaid') NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('leave','car','expenditure') NOT NULL,
	`status` enum('draft','pending','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`title` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `carRequests` ADD CONSTRAINT `carRequests_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenditureRequests` ADD CONSTRAINT `expenditureRequests_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveBalances` ADD CONSTRAINT `leaveBalances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaveRequests` ADD CONSTRAINT `leaveRequests_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requestApprovals` ADD CONSTRAINT `requestApprovals_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requestApprovals` ADD CONSTRAINT `requestApprovals_approverId_users_id_fk` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requestAttachments` ADD CONSTRAINT `requestAttachments_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;