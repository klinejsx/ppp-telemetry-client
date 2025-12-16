# Pinephone Pro Telemetry Paths Reference
## postmarketOS / Phosh - Device Telemetry Sources

This document catalogs all discovered telemetry paths on the Pinephone Pro running postmarketOS with Phosh shell. These paths can be used for holistic device telemetry for performance and power usage optimization.

---

## 1. BATTERY & POWER SUPPLY

### Primary Battery (RK818 PMIC)
**Base Path:** `/sys/class/power_supply/rk818-battery/`

| File | Description | Unit/Format |
|------|-------------|-------------|
| `capacity` | Battery percentage | 0-100 % |
| `status` | Charging status | Charging/Discharging/Full/Not charging |
| `voltage_now` | Current voltage | µV (microvolts) |
| `current_now` | Current draw (+ charging, - discharging) | µA (microamps) |
| `temp` | Battery temperature | °C × 10 (divide by 10) |
| `charge_full` | Current full capacity | µAh |
| `charge_full_design` | Design full capacity | µAh |
| `charge_counter` | Accumulated charge | µAh |
| `health` | Battery health status | Good/Overheat/Dead/etc |
| `present` | Battery present | 0/1 |
| `energy_full_design` | Design energy capacity | µWh |
| `voltage_max_design` | Maximum design voltage | µV |
| `voltage_min_design` | Minimum design voltage | µV |
| `charge_type` | Charge type | Fast/Trickle/Standard |
| `constant_charge_current` | CC phase current | µA |
| `constant_charge_voltage` | CV phase voltage | µV |

### USB Power Input (RK818)
**Base Path:** `/sys/class/power_supply/rk818-usb/`

| File | Description |
|------|-------------|
| `present` | USB power connected |
| `health` | Input health status |
| `input_current_limit` | Input current limit |
| `input_voltage_limit` | Input voltage limit |

### USB Type-C Power Delivery
**Base Path:** `/sys/class/power_supply/tcpm-source-psy-4-0022/`

| File | Description |
|------|-------------|
| `online` | PD source connected |
| `voltage_now` | Negotiated voltage |
| `voltage_min` | Minimum voltage |
| `voltage_max` | Maximum voltage |
| `current_now` | Current draw |
| `current_max` | Maximum current |
| `usb_type` | USB type (PD/DCP/SDP/etc) |

### USB Type-C Port Status
**Base Path:** `/sys/class/typec/port0/`

| File | Description |
|------|-------------|
| `data_role` | host/device |
| `power_role` | source/sink |
| `orientation` | Cable orientation |
| `port_type` | Port capabilities |
| `power_operation_mode` | default/1.5A/3.0A/usb_power_delivery |
| `vconn_source` | VCONN source status |

---

## 2. THERMAL MONITORING

### Thermal Zones
**Base Paths:**

| Zone | Path | Type |
|------|------|------|
| Zone 0 | `/sys/class/thermal/thermal_zone0/` | `rk818-battery` |
| Zone 1 | `/sys/class/thermal/thermal_zone1/` | `cpu-thermal` |
| Zone 2 | `/sys/class/thermal/thermal_zone2/` | `gpu-thermal` |

**Files per zone:**
- `temp` - Current temperature in milli°C (divide by 1000)
- `type` - Zone identifier
- `policy` - Thermal policy
- `trip_point_*_temp` - Trip point temperatures
- `trip_point_*_type` - Trip point types (passive/critical)

### Cooling Devices
**Base Path:** `/sys/class/thermal/cooling_device*/`

| File | Description |
|------|-------------|
| `type` | Cooling device type |
| `cur_state` | Current cooling state |
| `max_state` | Maximum cooling state |

---

## 3. CPU TELEMETRY

### Per-CPU Information (6 cores: cpu0-cpu5)
**Base Path:** `/sys/devices/system/cpu/cpu{0-5}/`

#### CPU Frequency Scaling
**Path:** `/sys/devices/system/cpu/cpu{0-5}/cpufreq/`

| File | Description | Permissions |
|------|-------------|-------------|
| `scaling_cur_freq` | Current frequency | Read |
| `cpuinfo_cur_freq` | Hardware frequency | Read (root) |
| `scaling_min_freq` | Min scaling frequency | Read/Write |
| `scaling_max_freq` | Max scaling frequency | Read/Write |
| `cpuinfo_min_freq` | Hardware min freq | Read |
| `cpuinfo_max_freq` | Hardware max freq | Read |
| `scaling_governor` | Current governor | Read/Write |
| `scaling_available_governors` | Available governors | Read |
| `scaling_available_frequencies` | Available frequencies | Read |

#### CPU Frequency Statistics
**Path:** `/sys/devices/system/cpu/cpu{0-5}/cpufreq/stats/`

| File | Description |
|------|-------------|
| `time_in_state` | Time spent at each frequency (jiffies) |
| `total_trans` | Total frequency transitions |
| `trans_table` | Transition matrix |

#### CPU Idle States
**Path:** `/sys/devices/system/cpu/cpu{0-5}/cpuidle/`

**States Available:**
- `state0/` - WFI (Wait For Interrupt)
- `state1/` - cpu-sleep
- `state2/` - cluster-sleep

**Files per state:**
- `name` - State name
- `desc` - Description
- `usage` - Entry count
- `time` - Time in state (µs)
- `latency` - Exit latency (µs)
- `residency` - Minimum residency (µs)

### System-wide CPU
**Path:** `/sys/devices/system/cpu/`

| File | Description |
|------|-------------|
| `online` | Online CPU list |
| `offline` | Offline CPU list |
| `present` | Present CPU list |
| `kernel_max` | Maximum CPU index |

### /proc CPU Stats
| File | Description |
|------|-------------|
| `/proc/stat` | CPU time breakdown (user/nice/system/idle/iowait/irq/softirq/steal) |
| `/proc/loadavg` | Load averages (1/5/15 min), running processes, total processes |
| `/proc/uptime` | System uptime, idle time (seconds) |

---

## 4. GPU TELEMETRY (Mali T860 - Panfrost)

### GPU Device
**Base Path:** `/sys/devices/platform/ff9a0000.gpu/`

| File | Description |
|------|-------------|
| `profiling` | GPU profiling enable |

### GPU DVFS (Dynamic Voltage Frequency Scaling)
**Base Path:** `/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/`

| File | Description |
|------|-------------|
| `cur_freq` | Current frequency (Hz) |
| `min_freq` | Minimum frequency |
| `max_freq` | Maximum frequency |
| `target_freq` | Target frequency |
| `governor` | DVFS governor |
| `available_frequencies` | Available frequencies |
| `available_governors` | Available governors |
| `polling_interval` | Polling interval (ms) |
| `trans_stat` | Transition statistics |

### GPU DRM Info
**Base Path:** `/sys/class/drm/`

| Device | Description |
|--------|-------------|
| `card0` | Panfrost GPU render device |
| `card1` | Rockchip display-subsystem |
| `card1-DSI-1` | DSI display output (phone screen) |
| `card1-DP-1` | DisplayPort output (USB-C alt mode) |
| `renderD128` | GPU render node |

---

## 5. MEMORY TELEMETRY

### System Memory
**Path:** `/proc/meminfo`

Key fields:
- `MemTotal` - Total physical RAM
- `MemFree` - Free memory
- `MemAvailable` - Available memory (includes reclaimable)
- `Buffers` - Buffer cache
- `Cached` - Page cache
- `SwapTotal` - Total swap space
- `SwapFree` - Free swap
- `Active` / `Inactive` - LRU lists
- `Dirty` - Memory waiting to be written back
- `Writeback` - Memory being written back
- `AnonPages` - Anonymous pages
- `Mapped` - Memory-mapped files
- `Slab` - Kernel slab cache

### Per-Process Memory
**Path:** `/proc/{pid}/statm`

Format: `size resident shared text lib data dt`
- All values in pages (multiply by 4096 for bytes)

### Swap/ZRAM
**Block Devices:** `/sys/block/zram{0-2}/`

---

## 6. STORAGE I/O

### Block Devices
| Device | Path | Description |
|--------|------|-------------|
| mmcblk1 | `/sys/block/mmcblk1/` | SD card |
| mmcblk2 | `/sys/block/mmcblk2/` | eMMC internal storage |

### Disk Statistics
**Path:** `/proc/diskstats`

Fields per device:
1. reads completed
2. reads merged
3. sectors read
4. time reading (ms)
5. writes completed
6. writes merged
7. sectors written
8. time writing (ms)
9. I/Os currently in progress
10. time doing I/Os (ms)
11. weighted time doing I/Os

### Per-Device Stats
**Path:** `/sys/block/{device}/stat`

---

## 7. NETWORK INTERFACES

### Interface List
| Interface | Path | Description |
|-----------|------|-------------|
| wlan0 | `/sys/class/net/wlan0/` | WiFi (RTL8723CS) |
| wwan0 | `/sys/class/net/wwan0/` | Cellular modem data |
| usb0 | `/sys/class/net/usb0/` | USB gadget network |
| lo | `/sys/class/net/lo/` | Loopback |

### Network Statistics
**Path:** `/proc/net/dev`

Per-interface fields:
- RX: bytes, packets, errs, drop, fifo, frame, compressed, multicast
- TX: bytes, packets, errs, drop, fifo, colls, carrier, compressed

### Per-Interface Detailed Stats
**Path:** `/sys/class/net/{iface}/statistics/`

| File | Description |
|------|-------------|
| `rx_bytes` | Received bytes |
| `tx_bytes` | Transmitted bytes |
| `rx_packets` | Received packets |
| `tx_packets` | Transmitted packets |
| `rx_errors` | Receive errors |
| `tx_errors` | Transmit errors |
| `rx_dropped` | Receive drops |
| `tx_dropped` | Transmit drops |

### WiFi-Specific
**Path:** `/sys/class/net/wlan0/`

| File | Description |
|------|-------------|
| `carrier` | Link up/down |
| `carrier_changes` | Link state changes |
| `operstate` | Operational state |
| `wireless/` | Wireless stats directory |

---

## 8. SENSORS (IIO - Industrial I/O)

### Discovered IIO Devices
**Base Path:** `/sys/bus/iio/devices/`

| Device | Name | Description |
|--------|------|-------------|
| iio:device0 | stk3310 | Ambient Light / Proximity Sensor |
| iio:device1 | af8133j | Magnetometer (compass) |
| iio:device2 | ff100000.saradc | ADC (analog inputs) |
| iio:device3 | mpu6500 | Accelerometer + Gyroscope (IMU) |

### Ambient Light & Proximity (stk3310)
**Path:** `/sys/bus/iio/devices/iio:device0/`

| File | Description |
|------|-------------|
| `in_illuminance_raw` | Light level (raw) |
| `in_illuminance_scale` | Light scale factor |
| `in_proximity_raw` | Proximity reading |
| `in_proximity_nearlevel` | Near threshold |

### Magnetometer (af8133j)
**Path:** `/sys/bus/iio/devices/iio:device1/`

| File | Description |
|------|-------------|
| `in_magn_x_raw` | X-axis magnetic field |
| `in_magn_y_raw` | Y-axis magnetic field |
| `in_magn_z_raw` | Z-axis magnetic field |
| `in_magn_scale` | Scale factor |
| `in_mount_matrix` | Mounting orientation |

### Accelerometer & Gyroscope (mpu6500)
**Path:** `/sys/bus/iio/devices/iio:device3/`

| File | Description |
|------|-------------|
| `in_accel_x_raw` | X-axis acceleration |
| `in_accel_y_raw` | Y-axis acceleration |
| `in_accel_z_raw` | Z-axis acceleration |
| `in_accel_scale` | Accelerometer scale |
| `in_anglvel_x_raw` | X-axis angular velocity |
| `in_anglvel_y_raw` | Y-axis angular velocity |
| `in_anglvel_z_raw` | Z-axis angular velocity |
| `in_anglvel_scale` | Gyroscope scale |
| `in_accel_mount_matrix` | Mounting orientation |

### ADC Channels
**Path:** `/sys/bus/iio/devices/iio:device2/`

| File | Description |
|------|-------------|
| `in_voltage0_raw` - `in_voltage5_raw` | ADC channel readings |
| `in_voltage_scale` | Voltage scale factor |

---

## 9. DISPLAY & BACKLIGHT

### Backlight Control
**Path:** `/sys/class/backlight/backlight/`

| File | Description | Permissions |
|------|-------------|-------------|
| `brightness` | Current brightness | Read/Write |
| `actual_brightness` | Actual brightness | Read |
| `max_brightness` | Maximum value | Read |
| `bl_power` | Backlight power | Read/Write |
| `scale` | Brightness scale type | Read |

### Display Panel
**Driver:** `panel-himax-hx8394` (DSI interface)

---

## 10. CELLULAR MODEM (Quectel EG25-G)

### USB Device Info
**Path:** `/sys/bus/usb/devices/2-1/`

| File | Description |
|------|-------------|
| `product` | "EG25-G" |
| `manufacturer` | "Quectel" |
| `idVendor` | USB vendor ID |
| `idProduct` | USB product ID |

### Serial Ports
| Device | Interface | Purpose |
|--------|-----------|---------|
| `/dev/ttyUSB0` | 2-1:1.0 | Modem control (PCUI) |
| `/dev/ttyUSB1` | 2-1:1.1 | GPS NMEA output |
| `/dev/ttyUSB2` | 2-1:1.2 | AT commands |
| `/dev/ttyUSB3` | 2-1:1.3 | Debug interface |
| `/dev/cdc-wdm0` | - | QMI/MBIM control |

### Network Interface
**Path:** `/sys/class/net/wwan0/`

---

## 11. BLUETOOTH

### Bluetooth Device
**Path:** `/sys/class/bluetooth/hci0/`

### RF Kill Switch
**Path:** `/sys/class/rfkill/rfkill0/`

| File | Description |
|------|-------------|
| `type` | Device type |
| `state` | 0=blocked, 1=unblocked |
| `soft` | Software block state |
| `hard` | Hardware block state |

---

## 12. WIFI RF KILL

**Path:** `/sys/class/rfkill/rfkill2/`

Same structure as Bluetooth rfkill.

---

## 13. INPUT DEVICES

### Device List
**Path:** `/sys/class/input/`

| Device | Name | Event |
|--------|------|-------|
| input0 | gpio-keys | event0 |
| input1 | Goodix Capacitive TouchScreen | event1 |
| input3 | adc-keys | event2 |
| input4 | gpio-vibrator | event3 |
| input5 | PinePhonePro Headphones | event4 |

### Input Events
**Device Nodes:** `/dev/input/event{0-4}`

---

## 14. AUDIO (RT5640 Codec)

### Sound Card
**Path:** `/sys/class/sound/card0/`

| File/Dir | Description |
|----------|-------------|
| `id` | Card identifier |
| `controlC0` | ALSA control interface |
| `pcmC0D0p` | Playback PCM |
| `pcmC0D0c` | Capture PCM |

---

## 15. LEDS

### Available LEDs
**Path:** `/sys/class/leds/`

| LED | Description |
|-----|-------------|
| `red:` | Red notification LED |
| `green:` | Green notification LED |
| `blue:` | Blue notification LED |
| `rgb:indicator` | Multi-LED (combined RGB) |
| `white:flash` | Camera flash |
| `mmc2::` | eMMC activity LED |

### LED Control Files
| File | Description |
|------|-------------|
| `brightness` | Current brightness (0-max) |
| `max_brightness` | Maximum brightness |
| `trigger` | LED trigger mode |

---

## 16. VIBRATION MOTOR

### Vibrator Device
**Path:** `/sys/devices/platform/vibrator/`

**Control via Input Event:** `/dev/input/event3` (gpio-vibrator)

---

## 17. CAMERAS

### Video4Linux Devices
**Path:** `/sys/class/video4linux/`

| Device | Description |
|--------|-------------|
| video0 | RGA (2D accelerator) |
| video1-4 | ISP0 (rear camera) |
| video5-8 | ISP1 (front camera) |
| video9-10 | Video encoder |
| video11 | Video decoder |

### Camera Sensors
- **v4l-subdev4** - Rear camera sensor (1-0036)
- **v4l-subdev9** - Front camera sensor (1-001a)
- **v4l-subdev10** - LED flash controller
- **v4l-subdev11** - Camera focus (1-000c)

---

## 18. SYSTEM LOGS

### Systemd Journal
**Path:** `/var/log/journal/`

**Query Commands:**
```bash
# Recent kernel messages
journalctl -k -n 100 --no-pager

# Boot log
journalctl -b

# By priority
journalctl -p err

# By time range
journalctl --since "1 hour ago"

# By unit
journalctl -u NetworkManager

# List boots
journalctl --list-boots
```

### Kernel Messages (dmesg)
```bash
# Via journalctl (preferred)
journalctl -k

# Direct (requires privileges)
dmesg
```

### Important Log Sources
| Source | Command |
|--------|---------|
| System events | `journalctl -xe` |
| Kernel | `journalctl -k` |
| Boot | `journalctl -b` |
| Crashes | `coredumpctl list` |
| User session | `journalctl --user` |

---

## 19. PROCESS TELEMETRY

### System-wide
| Path | Description |
|------|-------------|
| `/proc/stat` | System-wide CPU stats |
| `/proc/meminfo` | Memory statistics |
| `/proc/loadavg` | Load averages |
| `/proc/uptime` | System uptime |
| `/proc/vmstat` | Virtual memory stats |

### Per-Process
**Path:** `/proc/{pid}/`

| File | Description |
|------|-------------|
| `stat` | Process status (CPU time, state, etc.) |
| `statm` | Memory usage (pages) |
| `status` | Human-readable status |
| `cmdline` | Command line arguments |
| `comm` | Process name |
| `fd/` | Open file descriptors |
| `io` | I/O statistics |
| `oom_score` | OOM kill score |
| `wchan` | Wait channel |
| `schedstat` | Scheduler statistics |
| `cgroup` | Control group membership |

### Process List
```bash
# List all PIDs
ls /proc/ | grep -E '^[0-9]+$'
```

---

## 20. HARDWARE MONITORS (hwmon)

### Discovered hwmon Devices
**Path:** `/sys/class/hwmon/`

| Device | Source | Description |
|--------|--------|-------------|
| hwmon0 | tcpm-source-psy-4-0022 | USB-C PD monitor |
| hwmon1 | rk818-usb | USB input monitor |
| hwmon2 | rk818-battery | Battery monitor |
| hwmon3 | thermal_zone1 | CPU thermal |
| hwmon4 | thermal_zone2 | GPU thermal |

---

## 21. WAKEUP SOURCES

### Wakeup Devices
**Path:** `/sys/class/wakeup/`

Lists all devices capable of waking the system from suspend.

### Wakeup Count
**Path:** `/sys/power/wakeup_count`

---

## 22. POWER MANAGEMENT

### System Power State
**Path:** `/sys/power/`

| File | Description |
|------|-------------|
| `state` | Supported sleep states |
| `wakeup_count` | Wakeup event counter |
| `pm_async` | Async suspend enable |
| `mem_sleep` | Supported mem sleep modes |

### Runtime PM (Per-device)
Available under each device's `power/` subdirectory:
- `runtime_status`
- `runtime_usage`
- `runtime_active_time`
- `runtime_suspended_time`

---

## QUICK REFERENCE - TELEMETRY COLLECTION SCRIPT

```bash
#!/bin/bash
# Sample telemetry collection

# Battery
echo "Battery: $(cat /sys/class/power_supply/rk818-battery/capacity)%"
echo "Status: $(cat /sys/class/power_supply/rk818-battery/status)"
echo "Voltage: $(($(cat /sys/class/power_supply/rk818-battery/voltage_now)/1000))mV"
echo "Current: $(($(cat /sys/class/power_supply/rk818-battery/current_now)/1000))mA"

# Temperatures
echo "CPU Temp: $(($(cat /sys/class/thermal/thermal_zone1/temp)/1000))°C"
echo "GPU Temp: $(($(cat /sys/class/thermal/thermal_zone2/temp)/1000))°C"
echo "Bat Temp: $(($(cat /sys/class/thermal/thermal_zone0/temp)/100))°C"

# CPU Frequencies
echo "CPU0: $(($(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq)/1000))MHz"
echo "GPU: $(($(cat /sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/cur_freq)/1000000))MHz"

# Memory
echo "Memory: $(grep MemAvailable /proc/meminfo)"

# Load
echo "Load: $(cat /proc/loadavg)"

# Brightness
echo "Brightness: $(cat /sys/class/backlight/backlight/brightness)/$(cat /sys/class/backlight/backlight/max_brightness)"
```

---

## DATA COLLECTION RECOMMENDATIONS

For a performance/power dashboard, prioritize these data sources:

### High-frequency (1-5 second intervals)
- Battery voltage, current, capacity
- CPU frequencies and load
- Temperatures
- Memory usage
- Network throughput

### Medium-frequency (30-60 second intervals)
- CPU time-in-state statistics
- Disk I/O statistics
- GPU frequency
- Process list and resource usage

### Event-driven
- System logs (journalctl streaming)
- Thermal events
- Wakeup events
- Network state changes

### On-demand
- Full process snapshots
- Crash dumps (coredumpctl)
- Boot analysis

---

*Generated from Pinephone Pro running postmarketOS - December 2025*

