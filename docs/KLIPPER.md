# Klipper Setup

Guide for configuring Klipper firmware on Creality Ender 5 S1.

## What is Klipper?

Klipper runs on Raspberry Pi and offloads complex calculations from the printer's MCU. Benefits:
- Better print quality via input shaping (resonance compensation)
- Pressure advance (improves corner quality)
- Faster speeds with better accuracy
- Live config editing without reflashing
- Easy integration with OctoPrint/Mainsail

## Architecture

```
[Raspberry Pi]  ←USB→  [Printer MCU]
    Klippy (Python)        (STM32 on Ender 5 S1)
    OctoPrint
    Moonraker (optional)
```

## Building Klipper Firmware for Ender 5 S1

```bash
cd ~/klipper
make menuconfig
```

Settings for Ender 5 S1 (STM32F401):
- Micro-controller: STM32
- Processor model: STM32F401
- Bootloader offset: 32KiB bootloader
- Communication interface: Serial (on USART1 PA10/PA9)
- Baud rate: 250000

```bash
make
# Flash via SD card method:
cp out/klipper.bin /media/pi/SDCARD/firmware.bin
# Insert SD card into printer, power cycle
```

## Key Calibrations

### 1. PID Tuning (required after any heater change)

```gcode
# Hotend
PID_CALIBRATE HEATER=extruder TARGET=230
# Bed
PID_CALIBRATE HEATER=heater_bed TARGET=85
SAVE_CONFIG
```

### 2. Extruder Steps (E-steps calibration)

```gcode
# Mark 120mm on filament, extrude 100mm
G91
M83
G1 E100 F50
# Measure actual extrusion, calculate:
# new_rotation_distance = old_rotation_distance * actual / commanded
```

### 3. Z-Offset (CR Touch probe)

```gcode
G28
PROBE_CALIBRATE
# Use paper test, adjust with TESTZ Z=-0.1 / TESTZ Z=+0.1
ACCEPT
SAVE_CONFIG
```

### 4. Bed Mesh

```gcode
G28
BED_MESH_CALIBRATE
SAVE_CONFIG
```

### 5. Pressure Advance

```gcode
# Print pressure advance test tower
SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=1 ACCEL=500
TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=.005
# Measure optimal layer, calculate:
# pressure_advance = start + measured_height * factor
```

## Useful Klipper Commands

```gcode
STATUS              # Show printer state
FIRMWARE_RESTART    # Restart Klipper firmware
G28                 # Home all axes
G28 X Y             # Home X and Y only
M119                # Show endstop states
GET_POSITION        # Show current position
PROBE               # Run single probe
BED_MESH_OUTPUT     # Show current mesh
DUMP_TMC STEPPER=stepper_x  # TMC driver info
```

## Resources

- [Klipper Config Reference](https://www.klipper3d.org/Config_Reference.html)
- [Ender 5 S1 Klipper config examples](https://github.com/Klipper3d/klipper/blob/master/config/)
- [Pressure Advance tuning](https://www.klipper3d.org/Pressure_Advance.html)
- [Input Shaper](https://www.klipper3d.org/Resonance_Compensation.html)
