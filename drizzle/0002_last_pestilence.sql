CREATE TABLE `duel_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host_key` text NOT NULL,
	`guest_key` text,
	`creator` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`host_seen` integer NOT NULL,
	`guest_seen` integer DEFAULT 0 NOT NULL,
	`host_ready` integer DEFAULT 0 NOT NULL,
	`guest_ready` integer DEFAULT 0 NOT NULL,
	`host_fighter` text NOT NULL,
	`guest_fighter` text,
	`arena` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`snapshot` text,
	`input` text,
	`seq` integer DEFAULT 0 NOT NULL,
	`input_seq` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `duel_creator_created` ON `duel_rooms` (`creator`,`created`);--> statement-breakpoint
CREATE INDEX `duel_expiry` ON `duel_rooms` (`expires`);