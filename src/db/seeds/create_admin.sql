-- Creates or updates one Better Auth email/password admin account.
-- Generate a compatible password hash with:
-- bun -e "import { hashPassword } from './src/utils/crypto.ts'; console.log(await hashPassword('ChangeMeAdmin123!'))"
-- bun -e "import { hashPassword } from './src/utils/crypto.ts'; console.log(await hashPassword('password'))"

DO $$
DECLARE
	admin_user_id text := 'admin_user_002';
	admin_name text := 'Admin User';
	admin_email text := 'admin1@example.com';
	admin_password_hash text := 'c903a23cfc1c4b6578b0b384f20f47d8:aab2cb7e373b2c0b2ea46fb80a0d688ef9f3545991fd3693b48856b960b7872f7e286f45cf4b876839b3c589e3b0075ce315e553e7fccb6085d8ae280e234a60';
	actual_user_id text;
BEGIN
	IF admin_password_hash = 'REPLACE_WITH_BETTER_AUTH_PASSWORD_HASH' THEN
		RAISE EXCEPTION 'Replace admin_password_hash with a Better Auth password hash before running this seed.';
	END IF;

	INSERT INTO "user" (
		"id",
		"name",
		"email",
		"email_verified",
		"image",
		"role",
		"created_at",
		"updated_at"
	)
	VALUES (
		admin_user_id,
		admin_name,
		lower(admin_email),
		true,
		NULL,
		'admin'::user_role,
		now(),
		now()
	)
	ON CONFLICT ("email") DO UPDATE
	SET
		"name" = EXCLUDED."name",
		"email_verified" = true,
		"role" = 'admin'::user_role,
		"updated_at" = now()
	RETURNING "id" INTO actual_user_id;

	INSERT INTO "account" (
		"id",
		"account_id",
		"provider_id",
		"user_id",
		"password",
		"created_at",
		"updated_at"
	)
	VALUES (
		'credential_' || actual_user_id,
		actual_user_id,
		'credential',
		actual_user_id,
		admin_password_hash,
		now(),
		now()
	)
	ON CONFLICT ("id") DO UPDATE
	SET
		"account_id" = EXCLUDED."account_id",
		"provider_id" = EXCLUDED."provider_id",
		"user_id" = EXCLUDED."user_id",
		"password" = EXCLUDED."password",
		"updated_at" = now();
END $$;
