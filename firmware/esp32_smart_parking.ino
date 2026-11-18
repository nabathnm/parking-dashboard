/*
 * ==============================================================================
 * SMARTCAMPUS PARKING - ESP32 FIRMWARE SKETCH
 * Hardware: ESP32 DevKit V1 + 2x HC-SR04 + Servo SG90 + RFID RC522 (Opsional)
 * Protocol: MQTT over TLS (Port 8883) to EMQX Cloud
 * Target Area: FILKOM (Fakultas Ilmu Komputer) - REAL DEVICE
 * ==============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ----------------- KONFIGURASI JARINGAN & BROKER -----------------
const char* WIFI_SSID       = "WIFI_KAMPUS_ATAU_HOTSPOT";
const char* WIFI_PASSWORD   = "PASSWORD_WIFI";

const char* MQTT_BROKER     = "hc66ff31.ala.asia-southeast1.emqxsl.com"; // EMQX Cloud Host
const int   MQTT_PORT       = 8883;                                      // Port TLS EMQX Cloud
const char* MQTT_USER       = "nabath";
const char* MQTT_PASSWORD   = "nabath";
const char* CLIENT_ID       = "ESP32-FILKOM-01";

// ----------------- PIN HARDWARE -----------------
// Slot A1 - Ultrasonik HC-SR04
const int TRIG_PIN_A1 = 5;
const int ECHO_PIN_A1 = 18;

// Slot A2 - Ultrasonik HC-SR04
const int TRIG_PIN_A2 = 19;
const int ECHO_PIN_A2 = 21;

// Portal Barrier Gate - Servo SG90
const int SERVO_PIN   = 13;
Servo gateServo;

// Objek Jaringan
WiFiClientSecure net;
PubSubClient client(net);

// Variabel Status Terakhir
String lastStatusA1 = "";
String lastStatusA2 = "";
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 20000; // 20 detik

// Jarak ambang batas (cm) - Kurang dari 10cm berarti TERISI
const float DISTANCE_THRESHOLD_CM = 10.0;

// Fungsi Mengukur Jarak Sensor Ultrasonik
float readDistanceCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // Timeout 30ms (~5 meter)
  if (duration == 0) return 999.0;
  return (duration * 0.0343) / 2.0;
}

// Callback saat menerima pesan MQTT dari Backend
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("[MQTT Command Received] Topic: ");
  Serial.print(topic);
  Serial.print(" | Payload: ");
  Serial.println(message);

  // Parsing JSON Command
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.print("JSON Parse Error: ");
    Serial.println(error.c_str());
    return;
  }

  const char* command = doc["command"]; // "OPEN" atau "CLOSED"
  int targetAngle = doc["target_angle"] | (strcmp(command, "OPEN") == 0 ? 90 : 0);

  if (command != NULL) {
    // 1. Eksekusi Gerakan Fisik Servo
    Serial.printf("[Actuator] Rotating Barrier Servo to %d degrees...\n", targetAngle);
    gateServo.write(targetAngle);
    delay(500); // Beri waktu aktuator mencapai posisi

    // 2. Kirim Status Aktual Balik ke EMQX (Konfirmasi Sukses)
    StaticJsonDocument<256> statusDoc;
    statusDoc["gate_id"] = "gate-filkom";
    statusDoc["status"] = command;
    statusDoc["servo_angle"] = targetAngle;
    statusDoc["safety_sensor"] = "CLEAR";
    statusDoc["timestamp"] = ""; // Diisi backend

    char buffer[256];
    serializeJson(statusDoc, buffer);
    client.publish("campus/parking/filkom/gate/gate-filkom/status", buffer, true);
    Serial.println("[MQTT Status Confirmed] Gate status published back to EMQX.");
  }
}

// Koneksi ke EMQX Cloud dengan LWT
void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to EMQX Cloud MQTT...");

    // Siapkan LWT (Last Will and Testament) jika ESP32 mati tiba-tiba
    const char* lwtTopic = "campus/parking/filkom/node/status";
    const char* lwtPayload = "{\"device_id\":\"ESP32-FILKOM-01\",\"status\":\"OFFLINE\",\"rssi\":0,\"uptime_seconds\":0}";

    if (client.connect(CLIENT_ID, MQTT_USER, MQTT_PASSWORD, lwtTopic, 1, true, lwtPayload)) {
      Serial.println(" CONNECTED!");

      // 1. Subscribe ke Topic Perintah Gerbang
      client.subscribe("campus/parking/filkom/gate/+/command", 1);
      Serial.println("Subscribed to: campus/parking/filkom/gate/+/command");

      // 2. Publikasi Status Node ONLINE
      publishNodeHeartbeat("ONLINE");
    } else {
      Serial.print(" FAILED, rc=");
      Serial.print(client.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void publishNodeHeartbeat(const char* status) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = CLIENT_ID;
  doc["status"] = status;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_seconds"] = millis() / 1000;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["mac_address"] = WiFi.macAddress();

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("campus/parking/filkom/node/status", buffer, true);
}

void publishSlot(const char* slotId, const char* status, float distanceCm) {
  StaticJsonDocument<256> doc;
  doc["slot_id"] = slotId;
  doc["status"] = status;
  doc["distance_cm"] = distanceCm;

  char buffer[256];
  serializeJson(doc, buffer);

  String topic = String("campus/parking/filkom/slots/") + slotId;
  client.publish(topic.c_str(), buffer, true);
  Serial.printf("[Slot %s] Published status: %s (Dist: %.1f cm)\n", slotId, status, distanceCm);
}

void setup() {
  Serial.begin(115200);

  // Pin Modes
  pinMode(TRIG_PIN_A1, OUTPUT);
  pinMode(ECHO_PIN_A1, INPUT);
  pinMode(TRIG_PIN_A2, OUTPUT);
  pinMode(ECHO_PIN_A2, INPUT);

  // Servo Setup
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Posisi default portal tertutup

  // Koneksi Wi-Fi
  Serial.printf("\nConnecting to Wi-Fi %s...", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected! IP Address: %s\n", WiFi.localIP().toString().c_str());

  // Set TLS insecure untuk kemudahan sertifikat cloud
  net.setInsecure();

  // Konfigurasi MQTT
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(512);

  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // 1. Baca Sensor Slot A1
  float distA1 = readDistanceCm(TRIG_PIN_A1, ECHO_PIN_A1);
  String statusA1 = (distA1 < DISTANCE_THRESHOLD_CM) ? "OCCUPIED" : "AVAILABLE";
  if (statusA1 != lastStatusA1) {
    lastStatusA1 = statusA1;
    publishSlot("A1", statusA1.c_str(), distA1);
  }

  delay(100);

  // 2. Baca Sensor Slot A2
  float distA2 = readDistanceCm(TRIG_PIN_A2, ECHO_PIN_A2);
  String statusA2 = (distA2 < DISTANCE_THRESHOLD_CM) ? "OCCUPIED" : "AVAILABLE";
  if (statusA2 != lastStatusA2) {
    lastStatusA2 = statusA2;
    publishSlot("A2", statusA2.c_str(), distA2);
  }

  // 3. Kirim Heartbeat Berkala
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    publishNodeHeartbeat("ONLINE");
  }

  delay(400); // Polling loop
}
