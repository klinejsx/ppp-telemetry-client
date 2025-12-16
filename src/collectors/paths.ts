/**
 * Centralized sysfs/procfs paths for Pinephone Pro
 * Based on PINEPHONE_PRO_TELEMETRY_PATHS.md
 */

export const PATHS = {
  // Battery & Power
  battery: {
    base: "/sys/class/power_supply/rk818-battery",
    capacity: "/sys/class/power_supply/rk818-battery/capacity",
    status: "/sys/class/power_supply/rk818-battery/status",
    voltage: "/sys/class/power_supply/rk818-battery/voltage_now",
    current: "/sys/class/power_supply/rk818-battery/current_now",
    temp: "/sys/class/power_supply/rk818-battery/temp",
    chargeFull: "/sys/class/power_supply/rk818-battery/charge_full",
    chargeFullDesign: "/sys/class/power_supply/rk818-battery/charge_full_design",
    health: "/sys/class/power_supply/rk818-battery/health",
    present: "/sys/class/power_supply/rk818-battery/present",
    chargeType: "/sys/class/power_supply/rk818-battery/charge_type",
    energyFullDesign: "/sys/class/power_supply/rk818-battery/energy_full_design",
  },
  
  usbInput: {
    base: "/sys/class/power_supply/rk818-usb",
    present: "/sys/class/power_supply/rk818-usb/present",
    health: "/sys/class/power_supply/rk818-usb/health",
    inputCurrentLimit: "/sys/class/power_supply/rk818-usb/input_current_limit",
    inputVoltageLimit: "/sys/class/power_supply/rk818-usb/input_voltage_limit",
  },
  
  usbCPd: {
    base: "/sys/class/power_supply/tcpm-source-psy-4-0022",
    online: "/sys/class/power_supply/tcpm-source-psy-4-0022/online",
    voltage: "/sys/class/power_supply/tcpm-source-psy-4-0022/voltage_now",
    voltageMin: "/sys/class/power_supply/tcpm-source-psy-4-0022/voltage_min",
    voltageMax: "/sys/class/power_supply/tcpm-source-psy-4-0022/voltage_max",
    current: "/sys/class/power_supply/tcpm-source-psy-4-0022/current_now",
    currentMax: "/sys/class/power_supply/tcpm-source-psy-4-0022/current_max",
    usbType: "/sys/class/power_supply/tcpm-source-psy-4-0022/usb_type",
  },
  
  typeCPort: {
    base: "/sys/class/typec/port0",
    dataRole: "/sys/class/typec/port0/data_role",
    powerRole: "/sys/class/typec/port0/power_role",
    orientation: "/sys/class/typec/port0/orientation",
    powerOperationMode: "/sys/class/typec/port0/power_operation_mode",
    vconnSource: "/sys/class/typec/port0/vconn_source",
  },

  // Thermal
  thermal: {
    zones: "/sys/class/thermal",
    zone: (n: number) => `/sys/class/thermal/thermal_zone${n}`,
    zoneTemp: (n: number) => `/sys/class/thermal/thermal_zone${n}/temp`,
    zoneType: (n: number) => `/sys/class/thermal/thermal_zone${n}/type`,
    coolingDevice: (n: number) => `/sys/class/thermal/cooling_device${n}`,
  },

  // CPU
  cpu: {
    base: "/sys/devices/system/cpu",
    cpuDir: (n: number) => `/sys/devices/system/cpu/cpu${n}`,
    freq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq`,
    scalingCurFreq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/scaling_cur_freq`,
    scalingMinFreq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/scaling_min_freq`,
    scalingMaxFreq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/scaling_max_freq`,
    cpuinfoMinFreq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/cpuinfo_min_freq`,
    cpuinfoMaxFreq: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/cpuinfo_max_freq`,
    governor: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/scaling_governor`,
    timeInState: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/stats/time_in_state`,
    totalTrans: (n: number) => `/sys/devices/system/cpu/cpu${n}/cpufreq/stats/total_trans`,
    idleState: (cpu: number, state: number) => `/sys/devices/system/cpu/cpu${cpu}/cpuidle/state${state}`,
    online: "/sys/devices/system/cpu/online",
    offline: "/sys/devices/system/cpu/offline",
  },

  // GPU
  gpu: {
    base: "/sys/devices/platform/ff9a0000.gpu",
    devfreq: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu",
    curFreq: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/cur_freq",
    targetFreq: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/target_freq",
    minFreq: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/min_freq",
    maxFreq: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/max_freq",
    governor: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/governor",
    availableFreqs: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/available_frequencies",
    pollingInterval: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/polling_interval",
    transStat: "/sys/devices/platform/ff9a0000.gpu/devfreq/ff9a0000.gpu/trans_stat",
  },

  // Memory
  memory: {
    meminfo: "/proc/meminfo",
  },

  // Network
  network: {
    netDev: "/proc/net/dev",
    interfaces: "/sys/class/net",
    ifaceStats: (iface: string) => `/sys/class/net/${iface}/statistics`,
    ifaceCarrier: (iface: string) => `/sys/class/net/${iface}/carrier`,
    ifaceOperstate: (iface: string) => `/sys/class/net/${iface}/operstate`,
    ifaceMtu: (iface: string) => `/sys/class/net/${iface}/mtu`,
    ifaceAddress: (iface: string) => `/sys/class/net/${iface}/address`,
  },

  // Storage
  storage: {
    diskstats: "/proc/diskstats",
    blocks: "/sys/block",
  },

  // Sensors (IIO)
  sensors: {
    iio: "/sys/bus/iio/devices",
    // Ambient Light / Proximity (stk3310 - iio:device0)
    als: {
      illuminanceRaw: "/sys/bus/iio/devices/iio:device0/in_illuminance_raw",
      illuminanceScale: "/sys/bus/iio/devices/iio:device0/in_illuminance_scale",
      proximityRaw: "/sys/bus/iio/devices/iio:device0/in_proximity_raw",
      proximityScale: "/sys/bus/iio/devices/iio:device0/in_proximity_scale",
      proximityNearLevel: "/sys/bus/iio/devices/iio:device0/in_proximity_nearlevel",
    },
    // Magnetometer (af8133j - iio:device1)
    mag: {
      xRaw: "/sys/bus/iio/devices/iio:device1/in_magn_x_raw",
      yRaw: "/sys/bus/iio/devices/iio:device1/in_magn_y_raw",
      zRaw: "/sys/bus/iio/devices/iio:device1/in_magn_z_raw",
      scale: "/sys/bus/iio/devices/iio:device1/in_magn_scale",
    },
    // ADC (ff100000.saradc - iio:device2)
    adc: {
      voltage: (ch: number) => `/sys/bus/iio/devices/iio:device2/in_voltage${ch}_raw`,
      scale: "/sys/bus/iio/devices/iio:device2/in_voltage_scale",
    },
    // IMU (mpu6500 - iio:device3)
    imu: {
      accelXRaw: "/sys/bus/iio/devices/iio:device3/in_accel_x_raw",
      accelYRaw: "/sys/bus/iio/devices/iio:device3/in_accel_y_raw",
      accelZRaw: "/sys/bus/iio/devices/iio:device3/in_accel_z_raw",
      accelScale: "/sys/bus/iio/devices/iio:device3/in_accel_scale",
      gyroXRaw: "/sys/bus/iio/devices/iio:device3/in_anglvel_x_raw",
      gyroYRaw: "/sys/bus/iio/devices/iio:device3/in_anglvel_y_raw",
      gyroZRaw: "/sys/bus/iio/devices/iio:device3/in_anglvel_z_raw",
      gyroScale: "/sys/bus/iio/devices/iio:device3/in_anglvel_scale",
    },
  },

  // System
  system: {
    backlight: {
      brightness: "/sys/class/backlight/backlight/brightness",
      maxBrightness: "/sys/class/backlight/backlight/max_brightness",
      power: "/sys/class/backlight/backlight/bl_power",
    },
    leds: "/sys/class/leds",
    rfkill: "/sys/class/rfkill",
    wakeupCount: "/sys/power/wakeup_count",
  },

  // Processes
  proc: {
    stat: "/proc/stat",
    loadavg: "/proc/loadavg",
    uptime: "/proc/uptime",
    pid: (pid: number) => `/proc/${pid}`,
    pidStat: (pid: number) => `/proc/${pid}/stat`,
    pidStatm: (pid: number) => `/proc/${pid}/statm`,
    pidCmdline: (pid: number) => `/proc/${pid}/cmdline`,
    pidComm: (pid: number) => `/proc/${pid}/comm`,
    pidIo: (pid: number) => `/proc/${pid}/io`,
    pidOomScore: (pid: number) => `/proc/${pid}/oom_score`,
  },
} as const;

