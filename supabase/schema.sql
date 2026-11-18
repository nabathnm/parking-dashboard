-- ==============================================================================
-- SMARTCAMPUS PARKING - SUPABASE DATABASE SCHEMA & SEED DATA
-- Sistem Monitoring Ketersediaan Parkir Kampus Terpusat Berbasis IoT
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL-TABEL UTAMA
-- ==============================================================================

-- 2.1 Tabel Area Parkir Fakultas (parking_areas)
CREATE TABLE IF NOT EXISTS parking_areas (
    id VARCHAR(50) PRIMARY KEY,
    faculty_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LIMITED', 'FULL', 'OFFLINE')),
    map_x NUMERIC(5, 2) NOT NULL DEFAULT 28.00,
    map_y NUMERIC(5, 2) NOT NULL DEFAULT 28.00,
    notes TEXT,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Tabel Slot Parkir (parking_slots)
-- Catatan: Slot parkir hanya mencatat status ketersediaan (tanpa distanceCm/kendaraan)
CREATE TABLE IF NOT EXISTS parking_slots (
    id VARCHAR(50) PRIMARY KEY,
    area_id VARCHAR(50) NOT NULL REFERENCES parking_areas(id) ON DELETE CASCADE,
    slot_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'UNKNOWN')),
    last_changed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa pencarian slot berdasarkan area
CREATE INDEX IF NOT EXISTS idx_slots_area_id ON parking_slots(area_id);

-- 2.3 Tabel Portal Gerbang Barrier (gates) - Tepat 1 Portal per Area
CREATE TABLE IF NOT EXISTS gates (
    id VARCHAR(50) PRIMARY KEY,
    area_id VARCHAR(50) UNIQUE NOT NULL REFERENCES parking_areas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN', 'CLOSED')),
    servo_angle INTEGER NOT NULL DEFAULT 0 CHECK (servo_angle IN (0, 90)),
    notes TEXT,
    last_toggled TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Tabel Perangkat IoT Gateway / ESP32 (iot_devices)
CREATE TABLE IF NOT EXISTS iot_devices (
    id VARCHAR(50) PRIMARY KEY, -- Misal: ESP32-FILKOM-NODE-01
    area_id VARCHAR(50) UNIQUE NOT NULL REFERENCES parking_areas(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL DEFAULT 'ESP32-WROOM-32D',
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE')),
    ip_address VARCHAR(45),
    mac_address VARCHAR(20),
    rssi INTEGER DEFAULT -60,
    firmware_version VARCHAR(50) DEFAULT 'v2.4.2',
    uptime_seconds BIGINT DEFAULT 0,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mqtt_topic VARCHAR(150),
    sensor_count INTEGER NOT NULL DEFAULT 2
);

-- 2.5 Tabel Riwayat Aktivitas Kendaraan (parking_activities)
CREATE TABLE IF NOT EXISTS parking_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    area_id VARCHAR(50) REFERENCES parking_areas(id) ON DELETE SET NULL,
    faculty VARCHAR(100) NOT NULL,
    slot_id VARCHAR(10) NOT NULL,
    activity VARCHAR(30) NOT NULL CHECK (activity IN ('IN', 'OUT', 'GATE_TRIGGER', 'SYSTEM_CHECK')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'UNKNOWN')),
    duration_minutes INTEGER
);

CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON parking_activities(timestamp DESC);

-- 2.6 Tabel Notifikasi Real-time (notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'alert')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    area_id VARCHAR(50) REFERENCES parking_areas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);


-- ==============================================================================
-- 3. VIEWS (PERHITUNGAN DINAMIS KAPASITAS, TERSEDIA, TERISI, OKUPANSI)
-- ==============================================================================

CREATE OR REPLACE VIEW v_parking_overview AS
SELECT 
    pa.id,
    pa.faculty_name,
    pa.description,
    pa.status,
    pa.map_x,
    pa.map_y,
    pa.notes AS area_notes,
    g.id AS gate_id,
    g.name AS gate_name,
    g.status AS gate_status,
    g.servo_angle AS gate_servo_angle,
    g.notes AS gate_notes,
    d.id AS device_id,
    d.model AS device_model,
    d.status AS device_status,
    d.rssi AS device_rssi,
    d.last_heartbeat AS device_last_heartbeat,
    pa.last_updated,
    COUNT(ps.id)::INTEGER AS total_slots,
    COUNT(CASE WHEN ps.status = 'AVAILABLE' THEN 1 END)::INTEGER AS available_slots,
    COUNT(CASE WHEN ps.status = 'OCCUPIED' THEN 1 END)::INTEGER AS occupied_slots,
    CASE 
        WHEN COUNT(ps.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN ps.status = 'OCCUPIED' THEN 1 END)::NUMERIC / COUNT(ps.id)::NUMERIC) * 100)::INTEGER
        ELSE 0 
    END AS occupancy_rate
FROM parking_areas pa
LEFT JOIN parking_slots ps ON pa.id = ps.area_id
LEFT JOIN gates g ON pa.id = g.area_id
LEFT JOIN iot_devices d ON pa.id = d.area_id
GROUP BY pa.id, g.id, d.id;


-- ==============================================================================
-- 4. OTOMASI TRIGGER (TRIGGER & FUNCTION)
-- ==============================================================================

-- 4.1 Otomatis sinkronisasi status area & catat log aktivitas saat slot berubah
CREATE OR REPLACE FUNCTION fn_handle_slot_change()
RETURNS TRIGGER AS $$
DECLARE
    v_faculty_name VARCHAR(100);
    v_total_slots INTEGER;
    v_avail_slots INTEGER;
    v_new_area_status VARCHAR(20);
    v_activity VARCHAR(10);
BEGIN
    -- Dapatkan nama fakultas
    SELECT faculty_name INTO v_faculty_name FROM parking_areas WHERE id = NEW.area_id;

    -- Hitung slot tersisa
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)
    INTO v_total_slots, v_avail_slots
    FROM parking_slots
    WHERE area_id = NEW.area_id;

    -- Tentukan status area otomatis
    IF v_avail_slots = 0 THEN
        v_new_area_status := 'FULL';
    ELSIF (v_avail_slots::NUMERIC / v_total_slots::NUMERIC) <= 0.25 THEN
        v_new_area_status := 'LIMITED';
    ELSE
        v_new_area_status := 'AVAILABLE';
    END IF;

    -- Update status & waktu pembaruan area parkir
    UPDATE parking_areas
    SET 
        status = v_new_area_status,
        last_updated = NOW()
    WHERE id = NEW.area_id;

    -- Jika terjadi perubahan status slot (AVAILABLE <-> OCCUPIED), catat ke riwayat
    IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        IF NEW.status = 'OCCUPIED' THEN
            v_activity := 'IN';
        ELSE
            v_activity := 'OUT';
        END IF;

        INSERT INTO parking_activities (
            area_id,
            faculty,
            slot_id,
            activity,
            status,
            duration_minutes
        ) VALUES (
            NEW.area_id,
            v_faculty_name,
            NEW.slot_number,
            v_activity,
            NEW.status,
            CASE WHEN v_activity = 'OUT' THEN FLOOR(RANDOM() * 120 + 15)::INTEGER ELSE NULL END
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_slot_change ON parking_slots;
CREATE TRIGGER trg_slot_change
AFTER INSERT OR UPDATE ON parking_slots
FOR EACH ROW
EXECUTE FUNCTION fn_handle_slot_change();


-- 4.2 Otomatis update waktu last_toggled pada portal gerbang saat servo berubah
CREATE OR REPLACE FUNCTION fn_handle_gate_toggle()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        NEW.last_toggled := NOW();
        IF NEW.status = 'OPEN' THEN
            NEW.servo_angle := 90;
        ELSE
            NEW.servo_angle := 0;
        END IF;
    END IF;

    -- Sinkronisasi waktu pembaruan area
    UPDATE parking_areas SET last_updated = NOW() WHERE id = NEW.area_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gate_toggle ON gates;
CREATE TRIGGER trg_gate_toggle
BEFORE UPDATE ON gates
FOR EACH ROW
EXECUTE FUNCTION fn_handle_gate_toggle();


-- ==============================================================================
-- 5. REALTIME REPLICATION (SUPABASE REALTIME)
-- ==============================================================================
-- Mengaktifkan pengiriman perubahan live ke dashboard tanpa polling
ALTER PUBLICATION supabase_realtime ADD TABLE parking_areas;
ALTER PUBLICATION supabase_realtime ADD TABLE parking_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE gates;
ALTER PUBLICATION supabase_realtime ADD TABLE iot_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE parking_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ==============================================================================
-- 6. PERMISSIONS & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 6.0 Berikan izin akses skema & tabel ke role anon dan authenticated Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

ALTER TABLE parking_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6.1 Mahasiswa / Publik (Anon): Izin BACA (SELECT) Saja
CREATE POLICY "Public Read Access: parking_areas" ON parking_areas FOR SELECT USING (true);
CREATE POLICY "Public Read Access: parking_slots" ON parking_slots FOR SELECT USING (true);
CREATE POLICY "Public Read Access: gates" ON gates FOR SELECT USING (true);
CREATE POLICY "Public Read Access: iot_devices" ON iot_devices FOR SELECT USING (true);
CREATE POLICY "Public Read Access: parking_activities" ON parking_activities FOR SELECT USING (true);
CREATE POLICY "Public Read Access: notifications" ON notifications FOR SELECT USING (true);

-- 6.2 Admin Dashboard & ESP32 Node: Izin TULIS / UPDATE (Buka-Tutup Gate, Ubah Status Slot, Catatan)
-- Catatan: Untuk prototype awal tanpa login, izinkan UPDATE status slot, gate, dan notes dari dashboard
CREATE POLICY "Dashboard Update: parking_slots" ON parking_slots FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Dashboard Update: gates" ON gates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Dashboard Update: parking_areas" ON parking_areas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Dashboard Insert: parking_activities" ON parking_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Dashboard Manage: notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 7. INITIAL SEED DATA (MOCK DATA KAMPUS SMARTPARKING)
-- ==============================================================================

-- 7.1 SEED: 4 Area Parkir Fakultas
INSERT INTO parking_areas (id, faculty_name, description, status, map_x, map_y, notes) VALUES
('filkom-main', 'Fakultas Ilmu Komputer', 'Area uji coba hardware asli dengan 2 sensor jarak HC-SR04 terhubung ke modul ESP32 dan 1 portal servo gate.', 'AVAILABLE', 28.00, 28.00, 'Kawasan testbed IoT terhubung langsung ke modul ESP32 live (2 sensor fisik asli).'),
('teknik-main', 'Fakultas Teknik', 'Area parkir terpadu Fakultas Teknik untuk dosen, mahasiswa, dan laboratorium.', 'LIMITED', 72.00, 28.00, 'Akses cepat ke Gedung Dekanat & Laboratorium Rekayasa Terpadu.'),
('feb-main', 'Fakultas Ekonomi dan Bisnis', 'Area parkir sentral FEB dengan kapasitas padat dan pemantauan sensor otomatis.', 'LIMITED', 72.00, 72.00, 'Kawasan parkir rindang sayap barat kampus FEB.'),
('fisip-main', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Area parkir berkanopi teduh di dekat Gedung Dekanat dan Aula FISIP.', 'AVAILABLE', 28.00, 72.00, 'Area parkir dekat aula utama dan gedung dekanat.')
ON CONFLICT (id) DO NOTHING;

-- 7.2 SEED: Portal Gerbang (1 Portal per Area)
INSERT INTO gates (id, area_id, name, status, servo_angle, notes) VALUES
('gate-filkom', 'filkom-main', 'Portal Gerbang FILKOM', 'CLOSED', 0, 'Portal gerbang utama gedung FILKOM (Otomatis ESP32)'),
('gate-teknik', 'teknik-main', 'Portal Gerbang Teknik', 'CLOSED', 0, 'Portal barrier otomatis timur kampus'),
('gate-feb', 'feb-main', 'Portal Gerbang FEB', 'CLOSED', 0, 'Portal akses cepat mahasiswa FEB'),
('gate-fisip', 'fisip-main', 'Portal Gerbang FISIP', 'CLOSED', 0, 'Portal barrier sayap aula dekanat')
ON CONFLICT (id) DO NOTHING;

-- 7.3 SEED: Perangkat IoT ESP32 / Gateway
INSERT INTO iot_devices (id, area_id, model, status, ip_address, mac_address, rssi, firmware_version, uptime_seconds, mqtt_topic, sensor_count) VALUES
('ESP32-FILKOM-NODE-01', 'filkom-main', 'ESP32-WROOM-32D (Dual-Core 240MHz)', 'ONLINE', '192.168.1.108', '24:6F:28:B4:9C:12', -58, 'v2.4.2-iot-mesh', 86420, 'smartcampus/parking/filkom/telemetry', 2),
('SIM-NODE-TEKNIK-02', 'teknik-main', 'Simulated Gateway Controller', 'ONLINE', '192.168.2.45', '30:AE:A4:07:9F:88', -64, 'v1.8.0-sim', 142000, 'smartcampus/parking/teknik/telemetry', 10),
('SIM-NODE-FEB-03', 'feb-main', 'Simulated Gateway Controller', 'ONLINE', '192.168.3.12', '48:3F:DA:11:44:CD', -70, 'v1.8.0-sim', 98000, 'smartcampus/parking/feb/telemetry', 10),
('SIM-NODE-FISIP-04', 'fisip-main', 'Simulated Gateway Controller', 'ONLINE', '192.168.4.88', '5C:CF:7F:89:12:33', -62, 'v1.8.0-sim', 64000, 'smartcampus/parking/fisip/telemetry', 10)
ON CONFLICT (id) DO NOTHING;

-- 7.4 SEED: Slot Parkir
-- FILKOM: Tepat 2 Sensor Device Asli (A1 & A2)
INSERT INTO parking_slots (id, area_id, slot_number, status) VALUES
('slot-a1', 'filkom-main', 'A1', 'OCCUPIED'),
('slot-a2', 'filkom-main', 'A2', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- Fakultas Teknik: 10 Slot Dummy (B1 - B10)
INSERT INTO parking_slots (id, area_id, slot_number, status) VALUES
('slot-b1', 'teknik-main', 'B1', 'OCCUPIED'),
('slot-b2', 'teknik-main', 'B2', 'OCCUPIED'),
('slot-b3', 'teknik-main', 'B3', 'OCCUPIED'),
('slot-b4', 'teknik-main', 'B4', 'OCCUPIED'),
('slot-b5', 'teknik-main', 'B5', 'OCCUPIED'),
('slot-b6', 'teknik-main', 'B6', 'OCCUPIED'),
('slot-b7', 'teknik-main', 'B7', 'AVAILABLE'),
('slot-b8', 'teknik-main', 'B8', 'AVAILABLE'),
('slot-b9', 'teknik-main', 'B9', 'AVAILABLE'),
('slot-b10', 'teknik-main', 'B10', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- FEB: 10 Slot Dummy (C1 - C10)
INSERT INTO parking_slots (id, area_id, slot_number, status) VALUES
('slot-c1', 'feb-main', 'C1', 'OCCUPIED'),
('slot-c2', 'feb-main', 'C2', 'OCCUPIED'),
('slot-c3', 'feb-main', 'C3', 'OCCUPIED'),
('slot-c4', 'feb-main', 'C4', 'OCCUPIED'),
('slot-c5', 'feb-main', 'C5', 'OCCUPIED'),
('slot-c6', 'feb-main', 'C6', 'OCCUPIED'),
('slot-c7', 'feb-main', 'C7', 'OCCUPIED'),
('slot-c8', 'feb-main', 'C8', 'OCCUPIED'),
('slot-c9', 'feb-main', 'C9', 'AVAILABLE'),
('slot-c10', 'feb-main', 'C10', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- FISIP: 10 Slot Dummy (D1 - D10)
INSERT INTO parking_slots (id, area_id, slot_number, status) VALUES
('slot-d1', 'fisip-main', 'D1', 'OCCUPIED'),
('slot-d2', 'fisip-main', 'D2', 'OCCUPIED'),
('slot-d3', 'fisip-main', 'D3', 'OCCUPIED'),
('slot-d4', 'fisip-main', 'D4', 'OCCUPIED'),
('slot-d5', 'fisip-main', 'D5', 'AVAILABLE'),
('slot-d6', 'fisip-main', 'D6', 'AVAILABLE'),
('slot-d7', 'fisip-main', 'D7', 'AVAILABLE'),
('slot-d8', 'fisip-main', 'D8', 'AVAILABLE'),
('slot-d9', 'fisip-main', 'D9', 'AVAILABLE'),
('slot-d10', 'fisip-main', 'D10', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 7.5 SEED: Riwayat Aktivitas Awal
INSERT INTO parking_activities (faculty, slot_id, activity, status, duration_minutes) VALUES
('Fakultas Ilmu Komputer', 'A1', 'IN', 'OCCUPIED', NULL),
('Fakultas Teknik', 'B6', 'OUT', 'AVAILABLE', 75),
('Fakultas Ekonomi dan Bisnis', 'C8', 'IN', 'OCCUPIED', NULL),
('Fakultas Ilmu Sosial dan Ilmu Politik', 'D2', 'IN', 'OCCUPIED', NULL),
('Fakultas Ilmu Komputer', 'A2', 'OUT', 'AVAILABLE', 42);

-- 7.6 SEED: Notifikasi Awal
INSERT INTO notifications (title, message, type, area_id) VALUES
('[ESP32] Kendaraan Terdeteksi di FILKOM', 'Sensor slot A1 mendeteksi kendaraan masuk.', 'info', 'filkom-main'),
('Area Parkir FEB Terbatas', 'Sisa slot parkir di FEB kini kurang dari 25%.', 'warning', 'feb-main');
