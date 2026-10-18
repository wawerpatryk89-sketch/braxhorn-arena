CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`started` integer NOT NULL,
	`finished` integer DEFAULT 0 NOT NULL,
	`elapsed` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`hp` integer DEFAULT 0 NOT NULL,
	`specials` integer DEFAULT 0 NOT NULL,
	`challenge_done` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`difficulty` text NOT NULL,
	`fighter` text NOT NULL,
	`score` integer NOT NULL,
	`elapsed` integer NOT NULL,
	`completed` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `results_board` ON `results` (`mode`,`difficulty`,`completed`,`score`,`elapsed`);--> statement-breakpoint
CREATE INDEX `results_owner` ON `results` (`owner`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`client` text NOT NULL,
	`mode` text NOT NULL,
	`difficulty` text NOT NULL,
	`fighter` text NOT NULL,
	`challenge` text,
	`started` integer NOT NULL,
	`updated` integer NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`elapsed` integer DEFAULT 0 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `run_owner_client` ON `runs` (`owner`,`client`);