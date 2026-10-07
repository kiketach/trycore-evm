-- Runs once, when the PostgreSQL container starts with an empty data volume.
-- Applies the schema to the application database and to a separate test database,
-- so integration tests run against real PostgreSQL without touching application data.

\i /db/schema.sql

CREATE DATABASE evm_test;
\connect evm_test
\i /db/schema.sql
