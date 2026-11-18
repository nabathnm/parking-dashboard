-- ==============================================================================
-- SMARTCAMPUS PARKING - SUPABASE MIGRATION: EMQX MQTT INTEGRATION
-- Menyesuaikan schema untuk integrasi ESP32 -> EMQX -> Backend -> Supabase
-- ==============================================================================

-- 1. Penambahan Kolom pada parking_areas
ALTER TABLE parking_areas 
    ADD COLUMN IF NOT EXISTS name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'SIMULATED',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tambahkan constraint check jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_parking_areas_data_source'
    ) THEN
        ALTER TABLE parking_areas ADD CONSTRAINT chk_parking_areas_data_source 
            CHECK (data_source IN ('REAL', 'SIMULATED'));
    END IF;
END $$;

-- Update data source: FILKOM adalah hardware fisik asli (REAL), fakultas lain SIMULATED
UPDATE parking_areas 
SET data_source = 'REAL', 
    capacity = 2,
    name = COALESCE(name, faculty_name),
    updated_at = NOW()
WHERE id = 'filkom-main';

UPDATE parking_areas 
SET data_source = 'SIMULATED',
    capacity = 10,
    name = COALESCE(name, faculty_name),
    updated_at = NOW()
WHERE id IN ('teknik-main', 'feb-main', 'fisip-main');


-- 2. Penambahan Kolom pada parking_slots
ALTER TABLE parking_slots 
    ADD COLUMN IF NOT EXISTS distance_cm NUMERIC(6, 2),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- 3. Penambahan Kolom pada gates
ALTER TABLE gates 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- 4. Penambahan Kolom pada iot_devices
ALTER TABLE iot_devices 
    ADD COLUMN IF NOT EXISTS device_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set device_name default
UPDATE iot_devices 
SET device_name = COALESCE(device_name, id)
WHERE device_name IS NULL;


-- 5. Penambahan Kolom pada parking_activities
ALTER TABLE parking_activities 
    ADD COLUMN IF NOT EXISTS previous_status VARCHAR(20) DEFAULT 'AVAILABLE',
    ADD COLUMN IF NOT EXISTS current_status VARCHAR(20) DEFAULT 'OCCUPIED',
    ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'SIMULATED';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_activities_data_source'
    ) THEN
        ALTER TABLE parking_activities ADD CONSTRAINT chk_activities_data_source 
            CHECK (data_source IN ('REAL', 'SIMULATED'));
    END IF;
END $$;


-- 6. Penyesuaian Kolom pada notifications
ALTER TABLE notifications 
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Buat trigger sinkronisasi read <-> is_read
CREATE OR REPLACE FUNCTION fn_sync_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read IS DISTINCT FROM OLD.read THEN
        NEW.is_read := NEW.read;
    ELSIF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
        NEW.read := NEW.is_read;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_read ON notifications;
CREATE TRIGGER trg_sync_notification_read
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION fn_sync_notification_read();


-- 7. Perbarui View v_parking_overview untuk menyertakan data_source
CREATE OR REPLACE VIEW v_parking_overview AS
SELECT 
    pa.id,
    pa.faculty_name,
    pa.name,
    pa.description,
    pa.status,
    pa.data_source,
    pa.map_x,
    pa.map_y,
    pa.notes AS area_notes,
    g.id AS gate_id,
    g.name AS gate_name,
    g.status AS gate_status,
    g.servo_angle AS gate_servo_angle,
    g.notes AS gate_notes,
    d.id AS device_id,
    d.device_name,
    d.model AS device_model,
    d.status AS device_status,
    d.rssi AS device_rssi,
    d.uptime_seconds AS device_uptime_seconds,
    d.last_heartbeat AS device_last_heartbeat,
    pa.last_updated,
    pa.updated_at,
    COUNT(ps.id)::INTEGER AS total_slots,
    COUNT(CASE WHEN ps.status = 'AVAILABLE' THEN 1 END)::INTEGER AS available_slots,
    COUNT(CASE WHEN ps.status = 'OCCUPIED' THEN 1 END)::INTEGER AS occupied_slots,
    CASE 
        WHEN COUNT(ps.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN ps.status = 'OCCUPIED' THEN 1 END)::NUMERIC / COUNT(ps.id)::NUMERIC) * 100, 1)
    END AS occupancy_rate
FROM parking_areas pa
LEFT JOIN parking_slots ps ON pa.id = ps.area_id
LEFT JOIN gates g ON pa.id = g.area_id
LEFT JOIN iot_devices d ON pa.id = d.area_id
GROUP BY 
    pa.id, pa.faculty_name, pa.name, pa.description, pa.status, pa.data_source, pa.map_x, pa.map_y, pa.notes,
    g.id, g.name, g.status, g.servo_angle, g.notes,
    d.id, d.device_name, d.model, d.status, d.rssi, d.uptime_seconds, d.last_heartbeat,
    pa.last_updated, pa.updated_at;


-- 8. GRANT HAK AKSES UNTUK SEMUA ROLE (Termasuk service_role untuk backend)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
