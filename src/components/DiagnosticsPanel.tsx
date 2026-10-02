import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import type { UseDs5BridgeResult } from "../hooks/useDs5Bridge";

export function DiagnosticsPanel({ bridge, isBusy }: { bridge: UseDs5BridgeResult; isBusy: boolean }) {
  const { t } = useTranslation();
  const data = bridge.diagnostics;
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ capturedAt: new Date().toISOString(), firmware: bridge.firmwareVersion, device: bridge.deviceLabel, ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ds5-diagnostics-${Date.now()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="diagnostics-panel">
    <Button variant="outline" className="w-full" onClick={bridge.readDiagnostics} disabled={!bridge.client || isBusy}>{t("diagnostics.read")}</Button>
    {data && <div className="state-box diagnostics-results">
      <strong>{t("diagnostics.title")}</strong>
      <p>{t("diagnostics.retention")}</p>
      <p>{t("diagnostics.total", { count: data.totalDisconnects })}</p>
      <p>{t(data.connected ? "diagnostics.connected" : "diagnostics.disconnected")}</p>
      <details><summary>{t("diagnostics.rates")}</summary><p>{data.reportsPerSecondNewestFirst.join(", ") || t("diagnostics.noSamples")}</p></details>
      {data.disconnects.length === 0 && <p>{t("diagnostics.empty")}</p>}
      {data.disconnects.map(event => <details key={event.sequence}>
        <summary>#{event.sequence} · {t("diagnostics.uptime", { seconds: (event.uptimeMs / 1000).toFixed(1) })} · 0x{event.reason.toString(16).padStart(2, "0")}</summary>
        <p>{t(`diagnostics.reasons.${event.reason}`, { defaultValue: t("diagnostics.unknownReason") })}</p>
        <p>{t("diagnostics.source")}: {t(`diagnostics.sources.${event.source}`)}</p>
        <p>{t("diagnostics.battery")}: {event.battery ? `≈${event.battery.approximatePercent}% (${t("diagnostics.powerState")}: ${event.battery.powerState})` : t("diagnostics.unknown")}</p>
        <p>{t("diagnostics.age")}: {event.lastReportAgeMs === null ? t("diagnostics.unknown") : `${event.lastReportAgeMs} ms`}</p>
        <p>{t("diagnostics.rates")}: {event.reportsPerSecondNewestFirst.join(", ") || t("diagnostics.noSamples")}</p>
        <p>{t("diagnostics.partial")}: {event.partialSecondReports}</p>
      </details>)}
      <Button variant="outline" className="w-full" onClick={exportData}>{t("diagnostics.export")}</Button>
    </div>}
  </div>;
}
