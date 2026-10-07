-- EVM dashboard schema.
-- EVM indicators (PV, EV, CV, SV, CPI, SPI, EAC, VAC) are NOT stored: they are derived on read
-- from the inputs below, so they can never drift out of sync with the data.

CREATE TABLE projects (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    description  TEXT,
    -- Informative only: the date the progress percentages refer to. Not used in calculations.
    cutoff_date  DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_projects_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE activities (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    name             VARCHAR(120) NOT NULL,
    bac              NUMERIC(14, 2) NOT NULL,
    planned_percent  NUMERIC(5, 2) NOT NULL,
    actual_percent   NUMERIC(5, 2) NOT NULL,
    actual_cost      NUMERIC(14, 2) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_activities_name_not_blank CHECK (btrim(name) <> ''),
    -- An activity without budget has PV = EV = 0 forever: meaningless in EVM.
    CONSTRAINT ck_activities_bac_positive CHECK (bac > 0),
    CONSTRAINT ck_activities_planned_percent_range CHECK (planned_percent BETWEEN 0 AND 100),
    CONSTRAINT ck_activities_actual_percent_range CHECK (actual_percent BETWEEN 0 AND 100),
    -- Overruns are real: actual_cost may exceed bac, but never be negative.
    CONSTRAINT ck_activities_actual_cost_non_negative CHECK (actual_cost >= 0)
);

CREATE INDEX ix_activities_project_id ON activities (project_id);
