-- Runs once, after 01_schema.sql, when the PostgreSQL container starts with an empty data volume.
-- Creates a separate test database with the same schema, so integration tests run against real
-- PostgreSQL without touching application data.

CREATE DATABASE evm_test;
\connect evm_test
\i /docker-entrypoint-initdb.d/01_schema.sql
