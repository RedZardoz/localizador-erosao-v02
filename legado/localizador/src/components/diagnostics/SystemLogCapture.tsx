"use client";

import React, { useEffect } from "react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { LogCategory, LogSeverity } from "@/types/erosion";

export const SystemLogCapture: React.FC = () => {
  const { addSystemLog } = useErosionStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Global uncaught errors listener
    const handleError = (event: ErrorEvent) => {
      // Filter out benign extension/resizing noise
      if (
        event.message?.includes("ResizeObserver") ||
        event.message?.includes("Script error")
      ) {
        return;
      }

      let category: LogCategory = "Aplicação";
      if (event.message?.includes("WebGL") || event.message?.includes("maplibre")) {
        category = "MapLibre";
      } else if (event.message?.includes("gee") || event.message?.includes("earth engine")) {
        category = "GEE";
      } else if (event.message?.includes("fetch") || event.message?.includes("network")) {
        category = "Rede";
      }

      addSystemLog({
        severity: "error",
        category,
        message: event.message || "Erro de execução da aplicação",
        details: event.error?.stack || `${event.filename}:${event.lineno}`,
      });
    };

    // Global unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = typeof reason === "string" ? reason : reason?.message || "Rejeição assíncrona não tratada";

      let category: LogCategory = "Aplicação";
      let severity: LogSeverity = "error";

      if (msg.includes("404") || msg.includes("Failed to fetch")) {
        category = "Rede";
        severity = "warning";
      } else if (msg.includes("GEE") || msg.includes("Earth Engine")) {
        category = "GEE";
      } else if (msg.includes("WebGL") || msg.includes("tile")) {
        category = "MapLibre";
        severity = "warning";
      }

      addSystemLog({
        severity,
        category,
        message: msg,
        details: reason?.stack,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [addSystemLog]);

  return null;
};
