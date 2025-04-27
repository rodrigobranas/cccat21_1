drop schema if exists ccca cascade;

create schema ccca;

create table ccca.account (
	account_id uuid,
	name text,
	email text,
	document text,
	password text,
	primary key (account_id)
);

create table ccca.account_asset (
	account_id uuid,
	transaction_id uuid,
	asset_id text,
	quantity numeric,
	primary key (account_id, asset_id)
);