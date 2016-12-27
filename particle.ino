/*
 * This is a minimal example, see extra-examples.cpp for a version
 * with more explantory documentation, example routines, how to
 * hook up your pixels and all of the pixel types that are supported.
 *
 */

#include "application.h"
#include "neopixel/neopixel.h" // use for Build IDE
// #include "neopixel.h" // use for local build

SYSTEM_MODE(AUTOMATIC);

// IMPORTANT: Set pixel COUNT, PIN and TYPE
#define PIXEL_PIN D2
#define PIXEL_COUNT 60
#define PIXEL_TYPE WS2812B
#define MODE_RAINBOW 0
#define MODE_MANUAL  1
#define MODE_XMAS    2
#define MODE_OFF     3
Adafruit_NeoPixel strip = Adafruit_NeoPixel(PIXEL_COUNT, PIXEL_PIN, PIXEL_TYPE);

// Prototypes for local build, ok to leave in for Build IDE
void rainbow(uint8_t wait);
uint32_t Wheel(byte WheelPos);
int setBrightness(String val);
int setMode(String val);
int setRGB(String val);

bool changed = true;
int brightness = 10;
int mode = MODE_XMAS;
int colorR = 255;
int colorG = 0;
int colorB = 0;
int iteration = 0;
void setup()
{
    RGB.control(true); 
    RGB.color(0, 0, 0);
    
    strip.begin();
    strip.show(); // Initialize all pixels to 'off'
    strip.setBrightness(brightness);

    Particle.function("setBright", setBrightness);
    Particle.function("setMode", setMode);
    Particle.function("setRGB", setRGB);
}

void loop()
{
    switch (mode) {
        case MODE_RAINBOW:
            rainbow(20);
            break;
        case MODE_XMAS:
            xmas();
            break;
        case MODE_OFF:
            off();
            break;
        default:
            manual();
            break;
    }
}

void off(){
    if(changed){
        changed = false;
        uint32_t black =  strip.Color(0, 0, 0);
        for(int i = 0; i < PIXEL_COUNT; i++){
            strip.setPixelColor(i, black);
        }
        strip.show();
    }
}

void xmas(){
    uint32_t colorRed =  strip.Color(255, 0, 0);
    uint32_t colorGreen =  strip.Color(0, 255, 0);
    iteration = (iteration + 1) % 2;
    strip.setBrightness(brightness);
    for(int i = 0; i < PIXEL_COUNT; i++){
        strip.setPixelColor(i, (i + iteration) % 2 ? colorRed : colorGreen);
    }
    strip.show();
    delay(2000);
}

void manual(){
    if (changed) {
        changed = false;
        strip.setBrightness(brightness);
        for(int i = 0; i < PIXEL_COUNT; i++){
            strip.setPixelColor(i, colorR, colorG, colorB);
            strip.show();
            delay(20);
        }
    }
}

int setRGB(String val){
    setMode("manual");
    int iR = val.indexOf(' ');
    int iG = val.indexOf(' ', iR + 1);

    colorR = atoi(val.substring(0,iR));
    colorG = atoi(val.substring(iR + 1,iG));
    colorB = atoi(val.substring(iG + 1));
    
    colorR = colorR < 0 ? 0 : colorR > 255 ? 255 : colorR;
    colorG = colorG < 0 ? 0 : colorG > 255 ? 255 : colorG;
    colorB = colorB < 0 ? 0 : colorB > 255 ? 255 : colorB;
    
    changed = true;
    return 1;
}

int setBrightness(String val){
    int b = atoi(val.c_str());
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    if (brightness != b) {
        brightness = b;
        changed = true;
    }
    return 1;
}

int setMode(String val){
    if (val.equalsIgnoreCase("rainbow")) {
        mode = MODE_RAINBOW;
    } else if (val.equalsIgnoreCase("xmas")) {
        mode = MODE_XMAS;
    } else if (val.equalsIgnoreCase("off")) {
        mode = MODE_OFF;
    } else {
        mode = MODE_MANUAL;
    }
    changed = true;
    return 1;
}

void rainbow(uint8_t wait) {
    uint16_t i, j;

    for (j = 0; j < 256; j++) {
        for (i = 0; i < strip.numPixels(); i++) {
            strip.setPixelColor(i, Wheel((i + j) & 255));
        }
        strip.show();
        delay(wait);
    }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
    if (WheelPos < 85) {
        return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
    } else if (WheelPos < 170) {
        WheelPos -= 85;
        return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
    } else {
        WheelPos -= 170;
        return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
    }
}


