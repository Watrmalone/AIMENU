#include <WiFi.h>
#include <WebSocketsClient.h>

// WiFi credentials
const char* ssid = "AIMENU";
const char* password = "aimenu123";

// WebSocket server details
const char* websocket_server = "ai-menu-backend.onrender.com";
const int websocket_port = 443;  // Using HTTPS port for secure connection

WebSocketsClient webSocket;

void setup() {
    Serial.begin(115200);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nConnected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    // Setup WebSocket
    webSocket.begin(websocket_server, websocket_port, "/ws", "wss");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    webSocket.enableHeartbeat(15000, 3000, 2);
}

void loop() {
    webSocket.loop();
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected. Reconnecting...");
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
            delay(500);
            Serial.print(".");
        }
        Serial.println("\nReconnected to WiFi");
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("Disconnected from WebSocket");
            break;
            
        case WStype_CONNECTED:
            Serial.println("Connected to WebSocket");
            // Send ESP32 identification message
            webSocket.sendTXT("ESP32");
            break;
            
        case WStype_TEXT:
            {
                String message = String((char*)payload);
                Serial.println("Received message: " + message);
                
                // Check if it's a motor command
                if (message.startsWith("MOTOR:")) {
                    String category = message.substring(6); // Remove "MOTOR:" prefix
                    Serial.println("Motor command received for category: " + category);
                    // Here you would add your motor control code
                }
            }
            break;
            
        case WStype_ERROR:
            Serial.println("WebSocket error");
            break;
            
        case WStype_PING:
            Serial.println("Received ping");
            break;
            
        case WStype_PONG:
            Serial.println("Received pong");
            break;
    }
} 