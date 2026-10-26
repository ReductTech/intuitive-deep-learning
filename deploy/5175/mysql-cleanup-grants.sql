-- Run as a database administrator for the Demo database and runtime account.
-- In MySQL, SELECT alone permits FOR SHARE, but FOR UPDATE also needs UPDATE.
-- Only the file-reference guard table needs this additional privilege; no DDL.
GRANT SELECT, UPDATE ON `shuku_idl_public`.`shuku_locks`
TO 'shuku_idl_runtime'@'127.0.0.1';
