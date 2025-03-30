// L298N Motor Driver Pin Definitions
// Motor 1 (Categories 1 and 3)
const int ENA = 10;  // Enable motor 1
const int IN1 = 9;   // Motor 1 input 1
const int IN2 = 8;   // Motor 1 input 2

// Motor 2 (Categories 2 and 4)
const int ENB = 5;   // Enable motor 2
const int IN3 = 7;   // Motor 2 input 1
const int IN4 = 6;   // Motor 2 input 2

// Motor speeds (0-255)
const int MOTOR_SPEED = 200;

void setup() {
  Serial.begin(9600);  // Communication with ESP32
  
  // Configure motor control pins as outputs
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  
  // Stop all motors initially
  stopAllMotors();
  
  // Print startup information
  Serial.println("----------------------------------------");
  Serial.println("L298N Motor Driver Debug Monitor");
  Serial.println("----------------------------------------");
  Serial.println("Waiting for commands from ESP32...");
  Serial.println("Available commands:");
  Serial.println("1 - Motor 1 (Categories 1,3)");
  Serial.println("2 - Motor 2 (Categories 2,4)");
  Serial.println("----------------------------------------");
}

void loop() {
  if (Serial.available() > 0) {
    // Read the category from ESP32
    int category = Serial.parseInt();
    
    // Print received command
    Serial.println("----------------------------------------");
    Serial.print("Received command: ");
    Serial.println(category);
    
    // Control motors based on category
    switch (category) {
      case 1:
      case 3:
        // Categories 1 and 3: Rotate motor 1
        Serial.println("Activating Motor 1");
        runMotor(ENA, IN1, IN2, MOTOR_SPEED);
        Serial.println("Motor 1 running...");
        delay(2000);  // Run for 2 seconds
        stopMotor(ENA, IN1, IN2);
        Serial.println("Motor 1 stopped");
        break;
        
      case 2:
      case 4:
        // Categories 2 and 4: Rotate motor 2
        Serial.println("Activating Motor 2");
        runMotor(ENB, IN3, IN4, MOTOR_SPEED);
        Serial.println("Motor 2 running...");
        delay(2000);
        stopMotor(ENB, IN3, IN4);
        Serial.println("Motor 2 stopped");
        break;
        
      default:
        Serial.println("Invalid command received!");
        break;
    }
    Serial.println("----------------------------------------");
  }
}

void runMotor(int enablePin, int in1, int in2, int speed) {
  analogWrite(enablePin, speed);
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
}

void stopMotor(int enablePin, int in1, int in2) {
  analogWrite(enablePin, 0);
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
}

void stopAllMotors() {
  stopMotor(ENA, IN1, IN2);
  stopMotor(ENB, IN3, IN4);
} 