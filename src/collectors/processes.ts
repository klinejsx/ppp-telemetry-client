/**
 * Process telemetry collector
 */

import type {
  ProcessesTelemetry,
  ProcessTelemetry,
  ProcessSummary,
  ProcessState,
} from "../types";
import { readSysfs, readSysfsInt, listSysfsDir } from "../utils/sysfs";
import { PATHS } from "./paths";
import { config } from "../config";

// Clock ticks per second (usually 100 on Linux)
const CLK_TCK = 100;

interface ProcStat {
  pid: number;
  comm: string;
  state: string;
  ppid: number;
  pgrp: number;
  session: number;
  utime: number;
  stime: number;
  priority: number;
  nice: number;
  numThreads: number;
  starttime: number;
  vsize: number;
  rss: number;
  rsslim: number;
}

function parseProcStat(content: string): ProcStat | null {
  // Format: pid (comm) state ppid pgrp session tty_nr tpgid flags
  //         minflt cminflt majflt cmajflt utime stime cutime cstime
  //         priority nice num_threads itrealvalue starttime vsize rss rsslim...
  const match = content.match(/^(\d+)\s+\((.+?)\)\s+(\S)\s+(.+)$/);
  if (!match) return null;

  const pid = parseInt(match[1], 10);
  const comm = match[2];
  const state = match[3];
  const rest = match[4].split(/\s+/).map(Number);

  return {
    pid,
    comm,
    state,
    ppid: rest[0] || 0,
    pgrp: rest[1] || 0,
    session: rest[2] || 0,
    utime: rest[10] || 0,      // Field 14 (0-indexed: 10 after ppid)
    stime: rest[11] || 0,      // Field 15
    priority: rest[14] || 0,    // Field 18
    nice: rest[15] || 0,        // Field 19
    numThreads: rest[16] || 0,  // Field 20
    starttime: rest[18] || 0,   // Field 22
    vsize: rest[19] || 0,       // Field 23
    rss: rest[20] || 0,         // Field 24 (in pages)
    rsslim: rest[21] || 0,      // Field 25
  };
}

async function collectProcess(pid: number, totalMemory: number): Promise<ProcessTelemetry | null> {
  const [statContent, cmdlineContent, oomScore] = await Promise.all([
    readSysfs(PATHS.proc.pidStat(pid)),
    readSysfs(PATHS.proc.pidCmdline(pid)),
    readSysfsInt(PATHS.proc.pidOomScore(pid)),
  ]);

  if (!statContent) return null;

  const stat = parseProcStat(statContent);
  if (!stat) return null;

  // cmdline is null-separated
  const cmdline = cmdlineContent?.replace(/\0/g, " ").trim() || stat.comm;

  // Convert times from clock ticks to milliseconds
  const userTimeMs = (stat.utime / CLK_TCK) * 1000;
  const systemTimeMs = (stat.stime / CLK_TCK) * 1000;
  const totalCpuTimeMs = userTimeMs + systemTimeMs;

  // RSS is in pages, convert to bytes (page size is usually 4096)
  const PAGE_SIZE = 4096;
  const rssBytes = stat.rss * PAGE_SIZE;

  // Calculate memory percentage
  const memoryPercent = totalMemory > 0 ? (rssBytes / totalMemory) * 100 : 0;

  return {
    pid: stat.pid,
    name: stat.comm,
    state: stat.state as ProcessState,
    ppid: stat.ppid,
    pgrp: stat.pgrp,
    session: stat.session,
    userTimeMs,
    systemTimeMs,
    totalCpuTimeMs,
    vsize: stat.vsize,
    rss: rssBytes,
    rssLimit: stat.rsslim,
    memoryPercent,
    numThreads: stat.numThreads,
    nice: stat.nice,
    priority: stat.priority,
    startTime: stat.starttime / CLK_TCK,
    cmdline,
    oomScore: oomScore ?? 0,
  };
}

export async function collectProcesses(): Promise<ProcessesTelemetry> {
  // Get total memory for percentage calculation
  const meminfoContent = await readSysfs("/proc/meminfo");
  let totalMemory = 0;
  if (meminfoContent) {
    const match = meminfoContent.match(/MemTotal:\s+(\d+)/);
    if (match) totalMemory = parseInt(match[1], 10) * 1024; // kB to bytes
  }

  // Get list of PIDs
  const procEntries = await listSysfsDir("/proc");
  const pids = procEntries
    .filter((e) => /^\d+$/.test(e))
    .map((e) => parseInt(e, 10))
    .filter((pid) => !isNaN(pid));

  // Collect all processes
  const processPromises = pids.map((pid) => collectProcess(pid, totalMemory));
  const allProcesses = (await Promise.all(processPromises)).filter(
    (p): p is ProcessTelemetry => p !== null
  );

  // Sort by CPU time (descending) and take top N
  const sortedByCpu = [...allProcesses].sort(
    (a, b) => b.totalCpuTimeMs - a.totalCpuTimeMs
  );
  const topProcesses = sortedByCpu.slice(0, config.maxProcesses);

  // Calculate summary
  const summary: ProcessSummary = {
    total: allProcesses.length,
    running: allProcesses.filter((p) => p.state === "R").length,
    sleeping: allProcesses.filter((p) => p.state === "S" || p.state === "D").length,
    zombie: allProcesses.filter((p) => p.state === "Z").length,
    stopped: allProcesses.filter((p) => p.state === "T" || p.state === "t").length,
  };

  // Get system-wide stats from /proc/stat
  const statContent = await readSysfs("/proc/stat");
  let contextSwitches = 0;
  let processesCreated = 0;
  let totalCpuTime = 0;

  if (statContent) {
    for (const line of statContent.split("\n")) {
      if (line.startsWith("ctxt ")) {
        contextSwitches = parseInt(line.split(/\s+/)[1], 10) || 0;
      } else if (line.startsWith("processes ")) {
        processesCreated = parseInt(line.split(/\s+/)[1], 10) || 0;
      } else if (line.startsWith("cpu ")) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        totalCpuTime = parts.reduce((a, b) => a + b, 0) * 10; // jiffies to ms
      }
    }
  }

  return {
    processes: topProcesses,
    summary,
    totalCpuTime,
    contextSwitches,
    processesCreated,
  };
}

