"""
Unit & Integration Tests for Spatial Graph Neural Network (GNN) on Spatial Proximity
NTRO Industrial Fire Intelligence System — Section 5.2 Out-of-the-Box AI
"""

import pytest
import numpy as np
import pandas as pd
from ml.spatial_gnn import SpatialGNNService, spatial_gnn_service, haversine_km
from ml.predict import ClassifierService


@pytest.fixture(scope="module")
def gnn():
    return SpatialGNNService(seed=123)


@pytest.fixture(scope="module")
def classifier():
    return ClassifierService()


def test_spatial_graph_construction_and_laplacian(gnn):
    """
    Verify adjacency matrix symmetry, Gaussian RBF weighting,
    and symmetric normalized augmented Laplacian spectral bounds.
    """
    hotspots = [
        {"latitude": 21.700, "longitude": 72.590, "frp": 60.0, "brightness": 360.0},
        {"latitude": 21.705, "longitude": 72.595, "frp": 85.0, "brightness": 375.0},
        {"latitude": 21.710, "longitude": 72.600, "frp": 45.0, "brightness": 350.0},
    ]
    A, X, G = gnn.build_spatial_graph(hotspots, radius_km=3.5)
    assert A.shape == (3, 3)
    assert X.shape == (3, 6)
    assert G.number_of_nodes() == 3

    # Symmetry of adjacency matrix
    np.testing.assert_allclose(A, A.T, rtol=1e-5)

    # All weights in [0, 1]
    assert np.all(A >= 0.0) and np.all(A <= 1.0)

    # Compute normalized Laplacian
    A_hat = gnn.compute_normalized_laplacian(A)
    assert A_hat.shape == (3, 3)
    np.testing.assert_allclose(A_hat, A_hat.T, rtol=1e-5)
    # Diagonal elements must be positive due to self-loops
    assert np.all(np.diag(A_hat) > 0.0)


def test_forward_gcn_message_passing(gnn):
    """
    Verify Kipf-Welling 2-layer GCN outputs correct embedding dimensions
    and non-negative ReLU activations.
    """
    hotspots = [
        {"latitude": 22.355, "longitude": 69.866, "frp": 38.0, "brightness": 345.0},
        {"latitude": 22.358, "longitude": 69.869, "frp": 42.0, "brightness": 350.0},
    ]
    A, X, _ = gnn.build_spatial_graph(hotspots)
    A_hat = gnn.compute_normalized_laplacian(A)
    H2, graph_emb = gnn.forward_gcn(A_hat, X)

    # Node embeddings: N x output_dim (2 x 8)
    assert H2.shape == (2, 8)
    assert np.all(H2 >= 0.0)  # ReLU non-negativity

    # Pooled graph embedding: 2 * output_dim = 16
    assert graph_emb.shape == (16,)
    assert np.linalg.norm(graph_emb) > 0.0


def test_isolated_point_source_topology(gnn):
    """
    Single refinery flare stack or isolated industrial heat source (N=1 or N=2)
    must be classified as ISOLATED_POINT_SOURCE with high industrial probability.
    """
    jamnagar_flare = [
        {"latitude": 22.355, "longitude": 69.866, "frp": 40.0, "brightness": 348.0, "site_id": "reliance_jamnagar"}
    ]
    res = gnn.analyze_hotspot_graph(jamnagar_flare, target_index=0)

    assert res["gnn_cluster_size"] == 1
    assert res["gnn_cluster_morphology"] == "ISOLATED_POINT_SOURCE"
    assert res["gnn_graph_density"] == 0.0
    assert res["gnn_industrial_topology_prob"] >= 0.90
    assert res["gnn_wildfire_topology_prob"] <= 0.10


def test_linear_wildfire_flame_front(gnn):
    """
    Synthesize an elongated 6-node advancing flame-front along a wind vector.
    High spatial elongation (> 2.5) must classify as LINEAR_PROPAGATION_FRONT.
    """
    wind_driven_front = [
        {"latitude": 24.00, "longitude": 75.00, "frp": 35.0},
        {"latitude": 24.01, "longitude": 75.01, "frp": 45.0},
        {"latitude": 24.02, "longitude": 75.02, "frp": 55.0},
        {"latitude": 24.03, "longitude": 75.03, "frp": 40.0},
        {"latitude": 24.04, "longitude": 75.04, "frp": 50.0},
        {"latitude": 24.05, "longitude": 75.05, "frp": 60.0},
    ]
    res = gnn.analyze_hotspot_graph(wind_driven_front, target_index=2)

    assert res["gnn_cluster_size"] == 6
    assert res["gnn_spatial_elongation"] >= 2.5
    assert res["gnn_cluster_morphology"] == "LINEAR_PROPAGATION_FRONT"
    assert res["gnn_wildfire_topology_prob"] >= 0.70


def test_compact_high_intensity_core(gnn):
    """
    Synthesize a dense 4-node disaster cluster within 400m footprint
    exhibiting high FRP (> 50 MW) and compact aspect ratio.
    Must classify as COMPACT_HIGH_INTENSITY_CORE.
    """
    chemical_disaster = [
        {"latitude": 21.7061, "longitude": 72.5925, "frp": 160.0},
        {"latitude": 21.7075, "longitude": 72.5938, "frp": 120.0},
        {"latitude": 21.7050, "longitude": 72.5915, "frp": 95.0},
        {"latitude": 21.7070, "longitude": 72.5910, "frp": 140.0},
    ]
    res = gnn.analyze_hotspot_graph(chemical_disaster, target_index=0)

    assert res["gnn_cluster_size"] == 4
    assert res["gnn_spatial_elongation"] < 2.5
    assert res["gnn_graph_density"] >= 0.50
    assert res["gnn_cluster_morphology"] == "COMPACT_HIGH_INTENSITY_CORE"
    assert res["gnn_industrial_topology_prob"] >= 0.80


def test_classifier_service_gnn_integration(classifier):
    """
    Test full end-to-end integration: ClassifierService batch prediction
    must populate GNN fields in both DataFrame columns and explainability metrics.
    """
    sample_df = pd.DataFrame([
        {
            "latitude": 21.7061,
            "longitude": 72.5925,
            "brightness_temp": 395.0,
            "frp": 192.6,
            "confidence": "high",
            "on_known_site": 1,
            "site_name": "Dahej PCPIR Complex",
            "site_type": "chemical",
            "land_cover_type": "industrial",
            "persistence_count": 4,
            "deviation_score": 5.9,
            "distance_to_site_km": 0.0,
            "detected_at": "2020-06-03 08:30:00+00:00",
        },
        {
            "latitude": 22.3550,
            "longitude": 69.8660,
            "brightness_temp": 342.0,
            "frp": 38.5,
            "confidence": "high",
            "on_known_site": 1,
            "site_name": "Reliance Jamnagar Refinery",
            "site_type": "refinery",
            "land_cover_type": "industrial",
            "persistence_count": 120,
            "deviation_score": 0.2,
            "distance_to_site_km": 0.0,
            "detected_at": "2020-06-03 08:30:00+00:00",
        },
    ])

    res = classifier.predict_detections(sample_df)

    # Check that all GNN columns exist in output DataFrame
    expected_cols = [
        "gnn_cluster_id",
        "gnn_cluster_size",
        "gnn_cluster_morphology",
        "gnn_graph_density",
        "gnn_clustering_coefficient",
        "gnn_spatial_elongation",
        "gnn_industrial_topology_prob",
        "gnn_wildfire_topology_prob",
    ]
    for col in expected_cols:
        assert col in res.columns, f"Missing GNN column {col} in predict_detections output"

    # Check Jamnagar GNN morphology
    jamnagar_row = res.iloc[1]
    assert jamnagar_row["gnn_cluster_morphology"] == "ISOLATED_POINT_SOURCE"
    assert jamnagar_row["gnn_industrial_topology_prob"] >= 0.90

    # Check Explainability narrative
    expl = jamnagar_row["shap_explanation"]
    assert "Spatial GNN Topology" in " ".join(expl["primary_factors"])
    assert "gnn_cluster_morphology" in expl["metrics"]
    assert expl["metrics"]["gnn_cluster_morphology"] == "ISOLATED_POINT_SOURCE"
