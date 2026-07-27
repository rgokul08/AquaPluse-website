/*
 * JalSathi - ESP32 Village Water Point Sensor Simulation (Wokwi)
 * ----------------------------------------------------------------
 * Simulates a water-flow sensor using a potentiometer on ADC pin 34.
 * The ESP32 reads the raw ADC value, converts it to a usage_count,
 * validates plausibility, smooths the value using a moving average,
 * detects a stuck sensor, and uploads JSON readings to the Flask
 * backend over HTTP using NON-BLOCKING timing (millis()-based).
 *
 * This sketch is written so it can later be adapted to a real
 * flow-sensor (e.g. YF-S201) simply by replacing readRawFlowValue().
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ---------------- Configuration ----------------
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* SERVER_URL = "http://<YOUR_SERVER_IP>:5000/api/readings"; // update to your Flask host

const char* WATERPOINT_ID = "WP001";
const char* HABITATION = "Anna Nagar";

const int FLOW_SENSOR_PIN = 34;        // potentiometer / flow sensor analog pin
const unsigned long READ_INTERVAL_MS = 5000;   // read sensor every 5 seconds
const unsigned long UPLOAD_INTERVAL_MS = 30000; // upload every 30 seconds
const unsigned long WIFI_RETRY_MS = 10000;      // retry network every 10 seconds

const int USAGE_MIN = 0;
const int USAGE_MAX = 500;
const int SMOOTHING_WINDOW = 5;
const int STUCK_WINDOW = 6;

// ---------------- State ----------------
unsigned long lastReadTime = 0;
unsigned long lastUploadTime = 0;
unsigned long lastWifiRetry = 0;

int rawHistory[SMOOTHING_WINDOW];
int rawHistoryCount = 0;
int rawHistoryIndex = 0;

int stuckHistory[STUCK_WINDOW];
int stuckHistoryCount = 0;
int stuckHistoryIndex = 0;

int smoothedUsage = 0;
bool currentFlowOk = true;
bool sensorFault = false;

// Very small in-memory offline queue (for when WiFi is unavailable)
#define QUEUE_SIZE 10
String offlineQueue[QUEUE_SIZE];
int queueHead = 0;
int queueCount = 0;

void enqueueReading(const String& payload) {
  if (queueCount < QUEUE_SIZE) {
    int idx = (queueHead + queueCount) % QUEUE_SIZE;
    offlineQueue[idx] = payload;
    queueCount++;
  } else {
    // queue full: drop oldest
    offlineQueue[queueHead] = payload;
    queueHead = (queueHead + 1) % QUEUE_SIZE;
  }
}

// ---------------- Sensor reading ----------------
int readRawFlowValue() {
  // Replace this with real flow-sensor pulse counting for production use.
  int raw = analogRead(FLOW_SENSOR_PIN); // 0 - 4095 on ESP32 ADC
  int usage = map(raw, 0, 4095, 0, 60);  // simulate 0-60 events per interval
  return usage;
}

bool isPlausible(int value) {
  if (value < USAGE_MIN || value > USAGE_MAX) {
    Serial.print("Rejected sensor reading: usage_count=");
    Serial.println(value);
    return false;
  }
  return true;
}

int applySmoothing(int newValue) {
  rawHistory[rawHistoryIndex] = newValue;
  rawHistoryIndex = (rawHistoryIndex + 1) % SMOOTHING_WINDOW;
  if (rawHistoryCount < SMOOTHING_WINDOW) rawHistoryCount++;

  long sum = 0;
  for (int i = 0; i < rawHistoryCount; i++) sum += rawHistory[i];
  return (int)(sum / rawHistoryCount);
}

void trackForStuckDetection(int value) {
  stuckHistory[stuckHistoryIndex] = value;
  stuckHistoryIndex = (stuckHistoryIndex + 1) % STUCK_WINDOW;
  if (stuckHistoryCount < STUCK_WINDOW) stuckHistoryCount++;
}

bool detectStuckSensor() {
  if (stuckHistoryCount < STUCK_WINDOW) return false;
  int first = stuckHistory[0];
  for (int i = 1; i < STUCK_WINDOW; i++) {
    if (stuckHistory[i] != first) return false;
  }
  return true;
}

// ---------------- Networking ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool isConnected() {
  return WiFi.status() == WL_CONNECTED;
}

String buildPayload(bool flowOk, int usage) {
  // recorded_at should ideally come from an RTC/NTP sync; for the
  // simulation we send a placeholder that the backend can override
  // if needed. Adjust getFormattedTimestamp() for a real deployment.
  String ts = getFormattedTimestamp();

  String json = "{";
  json += "\"waterpoint_id\":\"" + String(WATERPOINT_ID) + "\",";
  json += "\"habitation\":\"" + String(HABITATION) + "\",";
  json += "\"flow_ok\":" + String(flowOk ? "true" : "false") + ",";
  json += "\"usage_count\":" + String(usage) + ",";
  json += "\"recorded_at\":\"" + ts + "\"";
  json += "}";
  return json;
}

String getFormattedTimestamp() {
  // Placeholder ISO-8601 style timestamp using millis() uptime.
  // Replace with NTP time in a production deployment.
  unsigned long seconds = millis() / 1000;
  char buf[32];
  snprintf(buf, sizeof(buf), "2026-07-27T%02lu:%02lu:%02lu",
           (seconds / 3600) % 24, (seconds / 60) % 60, seconds % 60);
  return String(buf);
}

void uploadReading(const String& payload) {
  if (!isConnected()) {
    Serial.println("Network Offline - Monitoring Locally");
    enqueueReading(payload);
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);

  if (code > 0) {
    Serial.print("Upload response: ");
    Serial.println(code);
  } else {
    Serial.println("Upload failed, queuing locally.");
    enqueueReading(payload);
  }
  http.end();
}

void flushOfflineQueue() {
  if (!isConnected() || queueCount == 0) return;
  Serial.println("Network restored - uploading pending readings...");
  while (queueCount > 0) {
    String payload = offlineQueue[queueHead];
    queueHead = (queueHead + 1) % QUEUE_SIZE;
    queueCount--;

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
  }
}

// ---------------- Arduino lifecycle ----------------
void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // Non-blocking WiFi retry
  if (!isConnected() && now - lastWifiRetry >= WIFI_RETRY_MS) {
    lastWifiRetry = now;
    connectWiFi();
    if (isConnected()) flushOfflineQueue();
  }

  // Non-blocking sensor read every READ_INTERVAL_MS
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    int raw = readRawFlowValue();
    bool plausible = isPlausible(raw);

    if (plausible) {
      smoothedUsage = applySmoothing(raw);
      trackForStuckDetection(raw);
      sensorFault = detectStuckSensor();
      currentFlowOk = smoothedUsage > 0;
    } else {
      // impossible / suspicious values are rejected and not fed into smoothing
      currentFlowOk = smoothedUsage > 0;
    }

    Serial.print("Smoothed usage: ");
    Serial.print(smoothedUsage);
    Serial.print(" | Flow OK: ");
    Serial.print(currentFlowOk ? "true" : "false");
    Serial.print(" | Sensor Fault: ");
    Serial.println(sensorFault ? "true" : "false");
  }

  // Non-blocking upload every UPLOAD_INTERVAL_MS
  if (now - lastUploadTime >= UPLOAD_INTERVAL_MS) {
    lastUploadTime = now;
    String payload = buildPayload(currentFlowOk, smoothedUsage);
    Serial.print("Uploading: ");
    Serial.println(payload);
    uploadReading(payload);
  }

  // loop stays responsive - no blocking delay() calls anywhere
}
