CREATE TABLE `analyses` (
	`owner` text NOT NULL,
	`hash` text NOT NULL,
	`body` text NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`owner`, `hash`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journals` (
	`owner` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pairings` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires_at` integer NOT NULL,
	`claimed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotas` (
	`owner` text NOT NULL,
	`day` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`owner`, `day`)
);
