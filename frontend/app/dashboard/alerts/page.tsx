"use client";

import React, { useEffect, useState } from "react";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import { AlertThread } from "@/components/alerts/AlertThread";
import { fetchAlerts, Alert } from "@/lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      const data = await fetchAlerts();
      setAlerts(data);
      if (data.length > 0) setSelectedAlert(data[0]);
    }
    loadAlerts();
  }, []);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 max-w-[1920px] mx-auto w-full overflow-hidden">
      {/* Alert Feed Column */}
      <div className="md:col-span-5 lg:col-span-4 h-full">
        <AlertFeed
          alerts={alerts}
          selectedAlertId={selectedAlert?.id}
          onSelectAlert={(a) => setSelectedAlert(a)}
          onRefresh={async () => {
            const data = await fetchAlerts();
            setAlerts(data);
          }}
        />
      </div>

      {/* Incident Discussion & Dispatch Thread */}
      <div className="md:col-span-7 lg:col-span-8 h-full">
        <AlertThread
          alert={selectedAlert}
          onRefresh={async () => {
            const data = await fetchAlerts();
            setAlerts(data);
          }}
        />
      </div>
    </div>
  );
}
