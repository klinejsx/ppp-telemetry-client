/**
 * Storage I/O telemetry collector
 */

import type { StorageTelemetry, BlockDeviceTelemetry, BlockDeviceType } from "../types";
import { readSysfs, readSysfsInt, parseDiskstats, listSysfsDir } from "../utils/sysfs";
import { PATHS } from "./paths";

const SECTOR_SIZE = 512;

function getBlockDeviceType(name: string): BlockDeviceType {
  if (name === "mmcblk2" || name.startsWith("mmcblk2p")) return "emmc";
  if (name === "mmcblk1" || name.startsWith("mmcblk1p")) return "sdcard";
  if (name.startsWith("zram")) return "zram";
  if (name.startsWith("loop")) return "loop";
  return "other";
}

export async function collectStorage(): Promise<StorageTelemetry> {
  const diskstatsContent = await readSysfs(PATHS.storage.diskstats);
  if (!diskstatsContent) {
    return {
      devices: [],
      totalBytesRead: 0,
      totalBytesWritten: 0,
      totalIoTimeMs: 0,
    };
  }

  const stats = parseDiskstats(diskstatsContent);

  // Get block devices from /sys/block
  const blockEntries = await listSysfsDir(PATHS.storage.blocks);

  // Filter to main devices we care about (mmcblk1, mmcblk2, zram0)
  const relevantDevices = blockEntries.filter(
    (name) =>
      name === "mmcblk1" ||
      name === "mmcblk2" ||
      name === "zram0"
  );

  const devices: BlockDeviceTelemetry[] = [];
  let totalBytesRead = 0;
  let totalBytesWritten = 0;
  let totalIoTimeMs = 0;

  for (const name of relevantDevices) {
    const deviceStats = stats.get(name);
    if (!deviceStats) continue;

    const size = await readSysfsInt(`/sys/block/${name}/size`);
    const bytesRead = deviceStats.sectorsRead * SECTOR_SIZE;
    const bytesWritten = deviceStats.sectorsWritten * SECTOR_SIZE;

    devices.push({
      name,
      type: getBlockDeviceType(name),
      size: (size ?? 0) * SECTOR_SIZE,
      stats: deviceStats,
      bytesRead,
      bytesWritten,
    });

    totalBytesRead += bytesRead;
    totalBytesWritten += bytesWritten;
    totalIoTimeMs += deviceStats.ioTimeMs;
  }

  return {
    devices,
    totalBytesRead,
    totalBytesWritten,
    totalIoTimeMs,
  };
}

