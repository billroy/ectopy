//////////
//
// Heartbeat Detector: Detect and record heartbeat intervals from Pulse Sensor data
//
// Copyright 2016 by Bill Roy
// Licensed under MIT license
//

// input and output
int pulsePin = 0;       // pulse analog input pin
int blinkPin = 13;      // pin to blink on beat
int tonePin = 11;       // pin to tone on beat

// debugging output
int timingPin = 12;     // timing debugging pin
int statePin = 4;       // state debugging pin

#define SWITCH_THRESHOLD 65
#define MIN_BEAT_TIME 200

#define BLINK_TIME 10
#define TONE_FREQ 880
#define TONE_DURATION 100

bool goingUp = true;
unsigned int switchCount = 0;

int reading, lastReading;
unsigned long now, lastBeatTime;
unsigned int blinkPinOffTime;
unsigned int beatDuration;

void setup() {
    pinMode(blinkPin, OUTPUT);
    pinMode(tonePin, OUTPUT);
    pinMode(timingPin, OUTPUT);
    pinMode(statePin, OUTPUT);
    Serial.begin(115200);
    Serial.print("#heartbeat-detector here!\n#");
}

void loop() {

    digitalWrite(timingPin, !digitalRead(timingPin));

    lastReading = reading;
    reading = analogRead(pulsePin);

    now = millis();
    beatDuration = now - lastBeatTime;

    if (blinkPinOffTime && (beatDuration > blinkPinOffTime)) {
        digitalWrite(blinkPin, LOW);
        blinkPinOffTime = 0;
    }

    if (beatDuration < MIN_BEAT_TIME) return;      // avoid triggering on S-T wave

    if (goingUp) {
        if (reading < lastReading) {
            if (++switchCount > SWITCH_THRESHOLD) {
                digitalWrite(blinkPin, HIGH);   // signal beat
                blinkPinOffTime = BLINK_TIME;
                lastBeatTime = now;     // capture beat time
                Serial.println(beatDuration);
                tone(tonePin, TONE_FREQ, TONE_DURATION);
                goingUp = false;        // switch to down
                digitalWrite(statePin, goingUp);
                switchCount = 0;
            }
        }
        else if (reading > lastReading) if (switchCount) --switchCount;
    }
    else {      // going down: count consecutive upward 'errors'
        if (reading > lastReading) {
            if (++switchCount > SWITCH_THRESHOLD) {
                goingUp = true;
                digitalWrite(statePin, goingUp);
                switchCount = 0;
            }
        }
        else if (reading < lastReading) if (switchCount) --switchCount;
    }
}
