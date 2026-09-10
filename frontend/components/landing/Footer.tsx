import React from "react";
import { ExternalLink } from "lucide-react";

const DATA_SOURCES = [
  {
    name: "NASA FIRMS Telemetry",
    desc: "MODIS & VIIRS Thermal Anomaly Feeds",
    url: "https://firms.modaps.eosdis.nasa.gov/",
  },
  {
    name: "OpenStreetMap GIS",
    desc: "Industrial Infrastructure Boundaries",
    url: "https://www.openstreetmap.org/",
  },
  {
    name: "ESA WorldCover",
    desc: "10m Global Land Cover Classification",
    url: "https://esa-worldcover.org/",
  },
  {
    name: "Copernicus Sentinel",
    desc: "Multispectral Thermal Observation",
    url: "https://sentinels.copernicus.eu/",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#2f352e]/60 bg-[#141714] py-14 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs font-mono uppercase tracking-widest text-[#60675b] font-semibold">
            Data Sources &amp; Standards
          </p>
          <span className="text-xs font-mono text-[#60675b]">
            ThermoWatch Intelligence Platform
          </span>
        </div>

        {/* Clean borderless data sources letting text breathe naturally */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DATA_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group space-y-1.5 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#e8e4d9] group-hover:text-[#c05621] transition-colors">
                  {source.name}
                </span>
                <ExternalLink className="w-3 h-3 text-[#60675b] group-hover:text-[#e8e4d9] transition-colors" />
              </div>
              <p className="text-xs text-[#98a092] leading-relaxed">
                {source.desc}
              </p>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
