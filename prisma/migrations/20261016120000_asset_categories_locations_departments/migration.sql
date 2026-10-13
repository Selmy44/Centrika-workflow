-- Managed asset categories
CREATE TABLE "asset_categories" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tag_prefix" VARCHAR(10) NOT NULL,
    "useful_life_years" INTEGER NOT NULL DEFAULT 5,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "asset_categories_key_key" ON "asset_categories"("key");
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");
CREATE UNIQUE INDEX "asset_categories_tag_prefix_key" ON "asset_categories"("tag_prefix");

-- Starting list. The first five keep the keys existing assets already use.
INSERT INTO "asset_categories" ("key", "name", "tag_prefix", "useful_life_years", "description") VALUES
  ('it_equipment',      'IT equipment (general)',          'IT',   4, 'Computers and peripherals not covered by a more specific category'),
  ('furniture',         'Office furniture',                'FUR',  7, 'Desks, chairs, cabinets, shelving, meeting tables'),
  ('vehicles',          'Vehicles',                        'VEH',  8, 'Cars, vans and pick-ups'),
  ('software',          'Software licences',               'SW',   3, 'Paid software, subscriptions and licence keys'),
  ('other',             'Other',                           'GEN',  5, 'Anything that fits no other category'),
  ('laptops',           'Laptops',                         'LAP',  4, 'Notebook computers'),
  ('desktops',          'Desktop computers',               'DSK',  5, 'Desktop PCs and all-in-ones'),
  ('monitors',          'Monitors & displays',             'MON',  5, 'Screens, TVs used as displays'),
  ('phones_tablets',    'Mobile phones & tablets',         'MOB',  3, 'Company smartphones and tablets'),
  ('networking',        'Networking equipment',            'NET',  5, 'Routers, switches, firewalls, Wi-Fi access points'),
  ('servers_storage',   'Servers & storage',               'SRV',  5, 'Servers, NAS, backup drives, racks'),
  ('printers',          'Printers & scanners',             'PRN',  5, 'Printers, copiers, scanners'),
  ('pos_terminals',     'POS terminals & agent devices',   'POS',  3, 'Payment terminals and devices issued to agents'),
  ('audio_visual',      'Audio-visual & conferencing',     'AV',   5, 'Projectors, speakers, conference cameras and phones'),
  ('office_equipment',  'Office equipment',                'OFE',  5, 'Safes, shredders, binding and laminating machines'),
  ('motorcycles',       'Motorcycles',                     'MOTO', 5, 'Motorcycles and scooters'),
  ('power',             'Power & energy',                  'PWR',  8, 'Generators, UPS units, inverters, solar kits'),
  ('appliances',        'Kitchen & appliances',            'APP',  5, 'Fridges, microwaves, water dispensers, coffee machines'),
  ('security',          'Security equipment',              'SEC',  5, 'CCTV, access control, alarms'),
  ('tools',             'Tools & field equipment',         'TLS',  5, 'Tools, ladders, field and maintenance kit'),
  ('electronics',       'Other electronics',               'ELE',  4, 'Small electronics not covered elsewhere'),
  ('office_supplies',   'Office supplies & consumables',   'SUP',  1, 'Stationery, toner, cables: usually handed out, not tracked long-term');

-- Asset category is now a key into asset_categories instead of a fixed enum
ALTER TABLE "assets" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "assets" ALTER COLUMN "category" TYPE VARCHAR(50) USING "category"::text;
ALTER TABLE "assets" ALTER COLUMN "category" SET DEFAULT 'other';
DROP TYPE "AssetCategory";

-- Owning department
ALTER TABLE "assets" ADD COLUMN "department_id" INTEGER;
ALTER TABLE "assets" ADD CONSTRAINT "assets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "assets_category_idx" ON "assets"("category");
CREATE INDEX "assets_department_id_idx" ON "assets"("department_id");

-- Managed locations, starting from the ones assets already use
CREATE TABLE "asset_locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "asset_locations_name_key" ON "asset_locations"("name");
INSERT INTO "asset_locations" ("name")
  SELECT DISTINCT TRIM("location") FROM "assets" WHERE "location" IS NOT NULL AND TRIM("location") <> ''
  ON CONFLICT DO NOTHING;
