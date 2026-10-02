export const REPORT_DIAGNOSTICS = 0xfc;
export const disconnectSources = ["remote", "other", "inactivity", "usbSuspend", "shortcut", "bootselScan", "clearPairings", "l2capOpenFailed", "l2capClosed"];
export function diagnosticPayload(report: DataView): DataView {
  const offset = report.byteLength === 64 && report.getUint8(0) === REPORT_DIAGNOSTICS ? 1 : 0;
  if (report.byteLength - offset !== 63) throw new Error("Invalid diagnostics report length");
  return new DataView(report.buffer, report.byteOffset + offset, 63);
}
export function decodeDiagnostics(pages: DataView[]) {
  const h = pages[0];
  if (pages.length !== 11 || h.getUint8(0) !== 68 || h.getUint8(1) !== 71 || h.getUint8(2) !== 1 || h.getUint8(3) > 8 || h.getUint8(7) > 60) {
    throw new Error("Unsupported diagnostics protocol");
  }
  const battery = (raw: number, valid: boolean) => valid ? { raw, level: raw & 15, approximatePercent: Math.min((raw & 15) * 10, 100), powerState: raw >> 4 } : null;
  return {
    version: 1,
    snapshotId: h.getUint32(8, true),
    connected: Boolean(h.getUint8(4)),
    battery: battery(h.getUint8(6), Boolean(h.getUint8(5))),
    totalDisconnects: h.getUint32(12, true),
    sessionReports: h.getUint32(16, true),
    lastBucketStartedAtMs: h.getUint32(20, true),
    partialSecondReports: h.getUint16(24, true),
    reportsPerSecondNewestFirst: Array.from({ length: h.getUint8(7) }, (_, i) => pages[9 + Math.floor(i / 30)].getUint16((i % 30) * 2, true)),
    disconnects: Array.from({ length: h.getUint8(3) }, (_, i) => {
      const e = pages[i + 1];
      if (e.getUint8(27) > 16) throw new Error("Invalid diagnostics rate count");
      return {
        sequence: e.getUint32(0, true), uptimeMs: e.getUint32(4, true), connectedDurationMs: e.getUint32(8, true),
        lastReportAgeMs: e.getUint8(23) ? e.getUint32(12, true) : null,
        reports: e.getUint32(16, true), reason: e.getUint8(20), source: disconnectSources[e.getUint8(21)] ?? "other",
        battery: battery(e.getUint8(22), Boolean(e.getUint8(23))), rssi: e.getInt8(24) || null,
        authenticationStatus: e.getUint8(25), l2capStatus: e.getUint8(26), partialSecondReports: e.getUint16(28, true),
        reportsPerSecondNewestFirst: Array.from({ length: e.getUint8(27) }, (_, j) => e.getUint16(30 + j * 2, true)),
      };
    }),
  };
}
export type Diagnostics = ReturnType<typeof decodeDiagnostics>;
