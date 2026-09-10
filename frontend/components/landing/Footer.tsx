import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-tw-border bg-tw-surface/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tw-orange/15 border border-tw-orange/30 flex items-center justify-center">
                <Flame className="w-4.5 h-4.5 text-tw-orange" />
              </div>
              <span className="text-tw-text font-bold text-base">ThermoWatch</span>
            </div>

            <p className="text-tw-muted text-xs leading-relaxed max-w-md">
              AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources using NASA FIRMS, OpenStreetMap & satellite data.
            </p>

            <div className="flex items-center gap-3 text-[11px] text-tw-dim font-mono">
              <span className="px-2 py-0.5 rounded bg-tw-raised border border-tw-border text-tw-teal font-semibold">
                SIH PS 26162
              </span>
              <span>From Space to a Safer Tomorrow</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <p className="text-tw-text text-xs font-bold uppercase tracking-wider">
              Navigation
            </p>
            <ul className="space-y-2 text-xs">
              {[
                ["Home", "#home"],
                ["Solution", "#solution"],
                ["Impact", "#impact"],
                ["About", "#about"],
                ["Dashboard", "/dashboard"],
                ["Alerts", "/alerts"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-tw-muted hover:text-tw-text transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources */}
          <div className="space-y-3">
            <p className="text-tw-text text-xs font-bold uppercase tracking-wider">
              Data Sources & Standards
            </p>
            <ul className="space-y-2 text-xs">
              {[
                "NASA FIRMS / VIIRS Thermal",
                "OpenStreetMap Infrastructure",
                "ESA WorldCover Land Use",
                "Satellite Thermal Radiance",
              ].map((item) => (
                <li key={item} className="text-tw-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tw-teal/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-tw-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tw-dim">
          <p>© 2024 ThermoWatch · Smart India Hackathon 2024</p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-tw-text transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-tw-text transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-tw-text transition-colors"
            >
              X / Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
