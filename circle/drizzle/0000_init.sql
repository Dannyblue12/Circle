CREATE TABLE IF NOT EXISTS `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`gig_id` text NOT NULL,
	`lead_address` text NOT NULL,
	`pitch` text NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`milestones` text NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gig_id`) REFERENCES `gigs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `app_gig_lead` ON `applications` (`gig_id`,`lead_address`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `app_lead` ON `applications` (`lead_address`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gigs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_address` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`budget` real NOT NULL,
	`deadline` integer,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`project_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gigs_status_cat` ON `gigs` (`status`,`category`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `gigs_client` ON `gigs` (`client_address`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`idx` integer NOT NULL,
	`description` text NOT NULL,
	`member_name` text NOT NULL,
	`receiver` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`approve_tx` text,
	`release_tx` text,
	`dispute_by` text,
	`dispute_reason` text DEFAULT '' NOT NULL,
	`dispute_tx` text,
	`resolve_tx` text,
	`to_receiver` real,
	`to_client` real,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ms_project_idx` ON `milestones` (`project_id`,`idx`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ms_receiver` ON `milestones` (`receiver`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ms_status` ON `milestones` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pay_links` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_address` text NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`tx_hash` text,
	`payer` text,
	`paid_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `pay_links_tx_hash_unique` ON `pay_links` (`tx_hash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `links_owner` ON `pay_links` (`owner_address`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`client_address` text NOT NULL,
	`lead_address` text NOT NULL,
	`gig_id` text,
	`contract_id` text,
	`total` real NOT NULL,
	`platform_fee_pct` real DEFAULT 1 NOT NULL,
	`funded` integer DEFAULT false NOT NULL,
	`deploy_tx` text,
	`fund_tx` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `proj_client` ON `projects` (`client_address`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `proj_lead` ON `projects` (`lead_address`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`address` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
