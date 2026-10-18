CREATE TABLE `duel_results` (
	`code` text PRIMARY KEY NOT NULL,
	`host_player` text,
	`guest_player` text,
	`host_name` text NOT NULL,
	`guest_name` text NOT NULL,
	`host_fighter` text NOT NULL,
	`guest_fighter` text NOT NULL,
	`score` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `duel_result_host` ON `duel_results` (`host_player`);--> statement-breakpoint
CREATE INDEX `duel_result_guest` ON `duel_results` (`guest_player`);--> statement-breakpoint
CREATE TABLE `online_tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'registration' NOT NULL,
	`capacity` integer NOT NULL,
	`start_at` integer NOT NULL,
	`interval_minutes` integer NOT NULL,
	`timezone` text NOT NULL,
	`created` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`champion` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_code` ON `online_tournaments` (`code`);--> statement-breakpoint
CREATE INDEX `tournament_owner` ON `online_tournaments` (`owner`);--> statement-breakpoint
CREATE TABLE `tournament_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`fighter` text NOT NULL,
	`seed` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_player` ON `tournament_entries` (`tournament_id`,`player_id`);--> statement-breakpoint
CREATE TABLE `tournament_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tournament_history` ON `tournament_events` (`tournament_id`,`created`);--> statement-breakpoint
CREATE TABLE `tournament_fights` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`round` integer NOT NULL,
	`position` integer NOT NULL,
	`a` text,
	`b` text,
	`winner` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`scheduled_at` integer NOT NULL,
	`room_code` text,
	`score` text,
	`reason` text,
	`attempt` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tournament_round_position` ON `tournament_fights` (`tournament_id`,`round`,`position`);--> statement-breakpoint
CREATE INDEX `tournament_fight_room` ON `tournament_fights` (`room_code`);--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `host_player` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `guest_player` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `host_name` text DEFAULT 'GRACZ' NOT NULL;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `guest_name` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `tournament_fight` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `started_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `host_report` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `guest_report` text;--> statement-breakpoint
ALTER TABLE `duel_rooms` ADD `result_status` text DEFAULT '' NOT NULL;