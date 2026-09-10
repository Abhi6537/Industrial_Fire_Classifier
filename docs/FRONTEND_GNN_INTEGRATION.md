# Frontend Integration Guide: Spatial Graph Neural Network (GNN) on Spatial Proximity

> **STRICT COMPLIANCE NOTICE**: This document provides turnkey drop-in React components and integration blueprints for the frontend engineering team to merge post-evaluation. **Zero files inside `frontend/*` have been modified.**

---

## 1. Mathematical Foundation & Architectural Purpose

Under **Section 5.2 Out-of-the-Box AI**, the platform models FIRMS thermal observations as an interconnected spatial graph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$. Nodes represent satellite detections with normalized thermal/geometric features, and edges connect hotspots within an adaptive spatial radius ($R \le 3.5\text{ km}$) weighted via Gaussian RBF kernel:
$$w_{ij} = \exp\left(-\frac{d(i, j)^2}{2\sigma^2}\right)$$

A 2-layer Graph Convolutional Network (GCN) performs spatial message passing:
$$\mathbf{H}^{(l+1)} = \text{ReLU}\left(\mathbf{\tilde{D}}^{-\frac{1}{2}} \mathbf{\tilde{A}} \mathbf{\tilde{D}}^{-\frac{1}{2}} \mathbf{H}^{(l)} \mathbf{W}^{(l)}\right)$$

### Key Topological Metrics Exposed by API:
1. `gnn_cluster_morphology`:
   - `ISOLATED_POINT_SOURCE`: Solitary node or micro-cluster ($N \le 2$) — typical of fixed industrial plants, refinery flares, or small boiler rooms.
   - `COMPACT_HIGH_INTENSITY_CORE`: Dense, circular high-energy clique ($N \ge 3$, Elongation $< 2.2$, Density $\ge 0.50$, Mean FRP $\ge 25\text{ MW}$) — indicative of major petrochemical disasters, BLEVEs, or multi-tank conflagrations.
   - `LINEAR_PROPAGATION_FRONT`: Elongated chain of nodes ($\mathcal{E} \ge 2.5$) — hallmark signature of wind-driven wildfire flame fronts or advancing stubble fire lines.
   - `DIFFUSE_AGRICULTURAL_SWEEP`: Broad, loosely connected network — characteristic of scattered regional farm stubble burning.
2. `gnn_cluster_size`: Number of connected thermal nodes.
3. `gnn_graph_density`: Normalized edge density $\rho \in [0.0, 1.0]$.
4. `gnn_clustering_coefficient`: Transitivity / node interconnectedness.
5. `gnn_spatial_elongation`: Spatial aspect ratio ($\lambda_1 / \lambda_2$ from 2D coordinate covariance matrix).
6. `gnn_industrial_topology_prob`: Likelihood that the graph geometry represents an industrial site ($0.0$ to $1.0$).
7. `gnn_wildfire_topology_prob`: Likelihood that the graph geometry represents a wildfire or agricultural front ($0.0$ to $1.0$).

---

## 2. Drop-in React Components for Post-Merge

### 2.1 Graph Morphology Badge (`frontend/components/GraphMorphologyBadge.tsx`)
```tsx
import React from "react";
import { Network, Zap, Flame, Grid } from "lucide-react";

interface GraphMorphologyBadgeProps {
  morphology: string;
  clusterSize: number;
}

export const GraphMorphologyBadge: React.FC<GraphMorphologyBadgeProps> = ({
  morphology,
  clusterSize,
}) => {
  switch (morphology) {
    case "ISOLATED_POINT_SOURCE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          Isolated Point Source (N={clusterSize})
        </span>
      );
    case "COMPACT_HIGH_INTENSITY_CORE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-600/70 shadow-[0_0_12px_rgba(225,29,72,0.4)] animate-pulse">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          Compact High-Intensity Core (N={clusterSize})
        </span>
      );
    case "LINEAR_PROPAGATION_FRONT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/60">
          <Network className="w-3.5 h-3.5 text-amber-400" />
          Linear Flame Front (N={clusterSize})
        </span>
      );
    case "DIFFUSE_AGRICULTURAL_SWEEP":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-700/40">
          <Grid className="w-3.5 h-3.5 text-blue-400" />
          Diffuse Hotspot Network (N={clusterSize})
        </span>
      );
  }
};
```

---

### 2.2 Spatial GNN Network Inspector Card (`frontend/components/SpatialGNNCard.tsx`)
```tsx
import React from "react";
import { Share2, Activity, Compass, Layers } from "lucide-react";
import { GraphMorphologyBadge } from "./GraphMorphologyBadge";

interface SpatialGNNProps {
  clusterId: string;
  clusterSize: number;
  morphology: string;
  density: number;
  clusteringCoeff: number;
  elongation: number;
  industrialProb: number;
  wildfireProb: number;
}

export const SpatialGNNCard: React.FC<SpatialGNNProps> = ({
  clusterId,
  clusterSize,
  morphology,
  density,
  clusteringCoeff,
  elongation,
  industrialProb,
  wildfireProb,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Spatial GNN Topology Engine
          </h3>
        </div>
        <GraphMorphologyBadge morphology={morphology} clusterSize={clusterSize} />
      </div>

      {/* Cluster ID & Invariant Topology Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Cluster Nodes</span>
          <p className="text-lg font-mono font-bold text-cyan-300 mt-0.5">{clusterSize}</p>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Graph Density (ρ)</span>
          <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">{(density * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Spatial Elongation</span>
          <p className="text-lg font-mono font-bold text-amber-300 mt-0.5">{elongation.toFixed(1)}x</p>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Transitivity (C)</span>
          <p className="text-lg font-mono font-bold text-indigo-300 mt-0.5">{clusteringCoeff.toFixed(2)}</p>
        </div>
      </div>

      {/* Probability Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-emerald-400">Industrial Likelihood: {(industrialProb * 100).toFixed(1)}%</span>
          <span className="text-amber-400">Wildfire/Agro Likelihood: {(wildfireProb * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${industrialProb * 100}%` }}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${wildfireProb * 100}%` }}
          />
        </div>
      </div>

      {/* Operational Explanation */}
      <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/40 p-3 rounded border border-slate-800/50">
        {morphology === "ISOLATED_POINT_SOURCE" &&
          "Spatial Graph Neural Network confirms a stationary, zero-spread single-point emission typical of industrial plants or operational flare stacks."}
        {morphology === "COMPACT_HIGH_INTENSITY_CORE" &&
          "GNN detected a high-density, compact cluster of extreme thermal nodes within a 500m radius, highly consistent with an industrial BLEVE or refinery tank explosion."}
        {morphology === "LINEAR_PROPAGATION_FRONT" &&
          "GNN detected an elongated chain of thermal nodes (aspect ratio > 2.5x), indicating a wind-driven wildfire or crop stubble burn line."}
        {morphology === "DIFFUSE_AGRICULTURAL_SWEEP" &&
          "Broad, low-density network of dispersed hotspots, consistent with regional agricultural residue clearing."}
      </p>
    </div>
  );
};
```
