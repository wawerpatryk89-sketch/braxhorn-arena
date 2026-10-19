CREATE TABLE `account_credentials` (
	`player_id` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`iterations` integer NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_rate_expiry` ON `account_rate_limits` (`expires`);--> statement-breakpoint
CREATE TABLE `account_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_session_player` ON `account_sessions` (`player_id`);--> statement-breakpoint
CREATE INDEX `account_session_expiry` ON `account_sessions` (`expires`);--> statement-breakpoint
ALTER TABLE `players` ADD `avatar` text DEFAULT '/assets/avatar-male.jpg' NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `nick_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `player_nick_key` ON `players` (`nick_key`);