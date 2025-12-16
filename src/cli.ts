#!/usr/bin/env bun
/**
 * CLI tool for testing and debugging telemetry collection
 */

import { parseArgs } from "util";
import {
  collectHighFrequency,
  collectMediumFrequency,
  collectLowFrequency,
  collectFullSnapshot,
} from "./collectors";
import { config } from "./config";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    once: {
      type: "boolean",
      short: "o",
      default: false,
    },
    debug: {
      type: "boolean",
      short: "d",
      default: false,
    },
    frequency: {
      type: "string",
      short: "f",
      default: "all",
    },
    json: {
      type: "boolean",
      short: "j",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
  },
  strict: true,
  allowPositionals: false,
});

function printHelp(): void {
  console.log(`
Pinephone Pro Telemetry CLI

Usage: bun run src/cli.ts [options]

Options:
  -o, --once           Collect once and exit
  -d, --debug          Enable debug output
  -f, --frequency STR  Frequency to collect: high, medium, low, all, full (default: all)
  -j, --json           Output as JSON
  -h, --help           Show this help message

Examples:
  bun run src/cli.ts --once --frequency high
  bun run src/cli.ts -o -f full -j
  bun run src/cli.ts --debug --once
`);
}

async function main(): Promise<void> {
  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.debug) {
    console.log("Debug mode enabled");
    console.log("Config:", JSON.stringify(config, null, 2));
  }

  const frequency = values.frequency as string;

  console.log(`Collecting ${frequency} frequency telemetry...`);
  const startTime = performance.now();

  let data: unknown;

  switch (frequency) {
    case "high":
      data = await collectHighFrequency();
      break;
    case "medium":
      data = await collectMediumFrequency();
      break;
    case "low":
      data = await collectLowFrequency();
      break;
    case "full":
      data = await collectFullSnapshot();
      break;
    case "all":
    default:
      data = {
        high: await collectHighFrequency(),
        medium: await collectMediumFrequency(),
        low: await collectLowFrequency(),
      };
      break;
  }

  const elapsed = performance.now() - startTime;

  if (values.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("\n=== Telemetry Data ===");
    printTelemetry(data);
    console.log(`\nCollection took ${elapsed.toFixed(1)}ms`);
  }
}

function printTelemetry(data: unknown, indent = 0): void {
  const prefix = "  ".repeat(indent);

  if (data === null || data === undefined) {
    console.log(`${prefix}null`);
    return;
  }

  if (typeof data !== "object") {
    console.log(`${prefix}${data}`);
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log(`${prefix}[]`);
      return;
    }
    console.log(`${prefix}[${data.length} items]`);
    if (data.length <= 3) {
      data.forEach((item, i) => {
        console.log(`${prefix}  [${i}]:`);
        printTelemetry(item, indent + 2);
      });
    }
    return;
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null) {
      console.log(`${prefix}${key}:`);
      printTelemetry(value, indent + 1);
    } else {
      const formattedValue = formatValue(key, value);
      console.log(`${prefix}${key}: ${formattedValue}`);
    }
  }
}

function formatValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    // Format percentages
    if (key.includes("Percent") || key.includes("percent")) {
      return `${value.toFixed(1)}%`;
    }
    // Format temperatures
    if (key.includes("temp") || key.includes("Temp")) {
      return `${value.toFixed(1)}°C`;
    }
    // Format frequencies
    if (key.includes("Freq") || key.includes("freq")) {
      return `${value.toFixed(0)} MHz`;
    }
    // Format bytes
    if (key.includes("bytes") || key.includes("Bytes") || key === "total" || key === "free" || key === "available") {
      return formatBytes(value);
    }
    // Format voltages
    if (key.includes("voltage") || key.includes("Voltage")) {
      return `${value.toFixed(3)} V`;
    }
    // Format currents
    if (key.includes("current") || key.includes("Current")) {
      return `${value.toFixed(3)} A`;
    }
    // Default numeric formatting
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  }
  return String(value);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

