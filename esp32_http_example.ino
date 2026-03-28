#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// --- WiFi Credentials ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Server Configuration ---
// Replace with the IPv4 address of your computer running the Node.js backend
const String serverName = "http://192.168.X.X:3000/scan-entry/"; 

// --- RFID Pins (ESP32) ---
#define SS_PIN 5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

// 🔥 Function to convert UID to string
String getUID() {
  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }

  uid.toUpperCase(); // make it consistent
  return uid;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to Wi-Fi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP address:");
  Serial.println(WiFi.localIP());

  // SPI Pins (ESP32)
  SPI.begin(18, 19, 23, 5);

  rfid.PCD_Init();

  // 🔥 Increase antenna power (better reading)
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);

  Serial.println("Ready to scan RFID cards! Place your card...");
}

void loop() {
  // Check for new card
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Read card
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  Serial.println("Card detected!");

  // 🔥 Get UID in clean format
  String uid = getUID();

  Serial.print("UID: ");
  Serial.println(uid);

  // --- Send the HTTP GET request to the Backend Server ---
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Construct the full URL, e.g., http://192.168.1.10:3000/scan-entry/FAA9D605
    String serverPath = serverName + uid;
    
    Serial.println("Sending Request to: " + serverPath);
    
    http.begin(serverPath.c_str());
    
    // Send HTTP GET request
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Status Code: ");
      Serial.println(httpResponseCode);
      String payload = http.getString();
      Serial.println("Server Response: " + payload);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    // Free resources
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot send to backend.");
  }

  // Stop reading (important)
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Increased to 2 seconds to avoid duplicate HTTP requests spamming the backend
  delay(2000); 
}
