DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
CREATE TABLE "materials" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "default_unit" varchar,
  "material_category" varchar,
  "default_co2_per_kg" DECIMAL(10, 4),
  "default_co2_fossil_kg" DECIMAL(10, 4),
  "default_co2_biogenic_kg" DECIMAL(10, 4),
  "default_energy_mj_per_kg" DECIMAL(10, 4),
  "default_cost_per_kg" DECIMAL(10, 2),
  "default_currency" CHAR(3),
  "default_spi" DECIMAL(5, 2),
  "manually_added" bool,
  "updated_at" timestamp
);
CREATE TABLE "gearbox" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" text,
  "rated_power_kw" decimal(10, 4),
  "efficiency_percent" decimal(5, 2),
  "lifetime_years" integer,
  "operating_hours_per_year" decimal(10, 2),
  "electricity_emission_factor_kg_co2_per_kwh" decimal(10, 4),
  "created_at" timestamp,
  "updated_at" timestamp
);
CREATE TABLE "manufacturing_data" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "electricity_consumption_kwh_per_unit" decimal(10, 4),
  "fuel_consumption_mj_per_unit" decimal(10, 4),
  "fuel_type" varchar(100),
  "manufacturing_waste_kg_per_unit" decimal(10, 4),
  "factory_location" varchar(100),
  "description" text,
  "factory_country_code" char(3)
);
CREATE TABLE "transportation" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "description" text,
  "leg_description" varchar,
  "distance_km" decimal(10, 2),
  "transport_mode" varchar,
  "transport_mass_tonnes" decimal(10, 4),
  "emission_factor_kg_co2_per_tonne_km" decimal(10, 4)
);
CREATE TABLE "use_phase_data" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "operating_hours_per_year" decimal(10, 2),
  "energy_source_type" VARCHAR,
  "lubricant_replacement_interval_hours" decimal(10, 2),
  "lubricant_quantity_per_replacement_liters" decimal(10, 4)
);
CREATE TABLE "gearbox_materials" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "material_id" integer,
  "component_name" varchar,
  "recycled_content_percent" decimal(5, 2),
  "scrap_rate_percent" DECIMAL(5, 2),
  "environment_data_id" integer,
  "mass" integer,
  "unit" varchar
);
CREATE TABLE "maintenance_data" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "maintenance_interval_hours" decimal(10, 2),
  "maintenance_interval_years" DECIMAL(5, 2),
  "parts_replaced_per_interval_kg" DECIMAL(10, 4),
  "parts_replaced_per_interval_item_count" DECIMAL(10, 4),
  "emission_factor_spare_parts_kg_co2_per_kg" DECIMAL(10, 4),
  "technician_travel_distance_km" DECIMAL(10, 2),
  "service_transport_mode" VARCHAR(50),
  "lubricant_disposal_method" VARCHAR(100)
);
CREATE TABLE "end_of_life_data" (
  "id" serial PRIMARY KEY,
  "gearbox_id" integer,
  "recycling_rate_percent" DECIMAL(5, 2),
  "disposal_method" varchar,
  "recycling_credit_factor_kg_co2" DECIMAL(10, 4),
  "transport_to_recycler_km" DECIMAL(10, 2)
);
CREATE TABLE "environment_material_data" (
  "id" serial PRIMARY KEY,
  "material_id" int,
  "country_code" char(3),
  "co2_per_kg" float,
  "cost_per_kg" DECIMAL(10, 2),
  "description" varchar(50)
);
CREATE TABLE "evaluation_results" (
  "id" serial PRIMARY KEY,
  "gearbox_id" int,
  "materials_co2_total_kg" float,
  "material_cost" float,
  "manufacturing_co2_kg" DECIMAL(12, 4),
  "manufacturing_cost" DECIMAL(12, 2),
  "transportation_co2_kg" DECIMAL(12, 4),
  "transportation_cost" DECIMAL(12, 2),
  "use_phase_energy_co2_kg" DECIMAL(12, 4),
  "use_phase_energy_cost" DECIMAL(12, 2),
  "use_phase_maintenance_co2_kg" DECIMAL(12, 4),
  "use_phase_maintenance_cost" DECIMAL(12, 2),
  "end_of_life_co2_kg" DECIMAL(12, 4),
  "end_of_life_cost" DECIMAL(12, 2),
  "total_co2_kg" DECIMAL(12, 4),
  "total_energy_mj" DECIMAL(12, 4),
  "total_cost" DECIMAL(12, 2),
  "currency" CHAR(3),
  "average_spi" DECIMAL(5, 2),
  "social_data_id" int,
  "calculated_at" timestamp
);
CREATE TABLE "social_data" ("id" serial PRIMARY KEY, "spi" float);
CREATE TABLE "electricity_costs" (
  "id" serial,
  "country_code" CHAR(3) NOT NULL,
  "average_electricity_cost_per_kwh" DECIMAL(10, 2),
  "currency" CHAR(3)
);
ALTER TABLE "manufacturing_data"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "transportation"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "use_phase_data"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "gearbox_materials"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "gearbox_materials"
ADD FOREIGN KEY ("material_id") REFERENCES "materials" ("id");
ALTER TABLE "gearbox_materials"
ADD FOREIGN KEY ("environment_data_id") REFERENCES "environment_material_data" ("id");
ALTER TABLE "maintenance_data"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "end_of_life_data"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "environment_material_data"
ADD FOREIGN KEY ("material_id") REFERENCES "materials" ("id");
ALTER TABLE "evaluation_results"
ADD FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id");
ALTER TABLE "evaluation_results"
ADD FOREIGN KEY ("social_data_id") REFERENCES "social_data" ("id");
ALTER TABLE "manufacturing_data" DROP CONSTRAINT IF EXISTS manufacturing_data_gearbox_id_fkey,
  ADD CONSTRAINT manufacturing_data_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transportation" DROP CONSTRAINT IF EXISTS transportation_gearbox_id_fkey,
  ADD CONSTRAINT transportation_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "use_phase_data" DROP CONSTRAINT IF EXISTS use_phase_data_gearbox_id_fkey,
  ADD CONSTRAINT use_phase_data_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gearbox_materials" DROP CONSTRAINT IF EXISTS gearbox_materials_gearbox_id_fkey,
  ADD CONSTRAINT gearbox_materials_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_data" DROP CONSTRAINT IF EXISTS maintenance_data_gearbox_id_fkey,
  ADD CONSTRAINT maintenance_data_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "end_of_life_data" DROP CONSTRAINT IF EXISTS end_of_life_data_gearbox_id_fkey,
  ADD CONSTRAINT end_of_life_data_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_results" DROP CONSTRAINT IF EXISTS evaluation_results_gearbox_id_fkey,
  ADD CONSTRAINT evaluation_results_gearbox_id_fkey FOREIGN KEY ("gearbox_id") REFERENCES "gearbox" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_results"
ADD FOREIGN KEY ("social_data_id") REFERENCES "social_data" ("id") ON DELETE
SET NULL;
ALTER TABLE "gearbox_materials"
ALTER COLUMN "gearbox_id"
SET NOT NULL;
ALTER TABLE "gearbox_materials"
ALTER COLUMN "material_id"
SET NOT NULL;
ALTER TABLE "gearbox_materials"
ALTER COLUMN "environment_data_id"
SET NOT NULL;
ALTER TABLE "materials"
ALTER COLUMN "updated_at"
SET DEFAULT NOW();
ALTER TABLE "gearbox"
ALTER COLUMN "created_at"
SET DEFAULT NOW();
ALTER TABLE "gearbox"
ALTER COLUMN "updated_at"
SET DEFAULT NOW();
ALTER TABLE "evaluation_results"
ALTER COLUMN "calculated_at"
SET DEFAULT NOW();
ALTER TABLE gearbox_materials
ALTER COLUMN environment_data_id DROP NOT NULL;
ALTER TABLE use_phase_data
ADD CONSTRAINT unique_use_phase_per_gearbox UNIQUE (gearbox_id);
CREATE TABLE "users_data" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL
);
INSERT INTO "users_data" (username, password_hash)
VALUES (
    'admin',
    '$2a$12$Nx.n0QjwQo.MHOGI5y.90uqk3Qzg.ZMd7it8cffztyZ3TL1ruIvmi'
  );
-- password is 'adminpass'