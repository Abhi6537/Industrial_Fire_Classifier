"""
API Verification Test Script
Validates all FastAPI endpoints using TestClient.
Tests:
- /health
- /api/v1/events
- /api/v1/sites
- /api/v1/sites/geojson
- /api/v1/alerts
- /api/v1/alerts/{id}/acknowledge
- /api/v1/alerts/{id}/comments
- /api/v1/audit
- /api/v1/classify
"""

import os
import sys
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.main import app

client = TestClient(app)


def test_all_endpoints():
    print("=" * 70)
    print("RUNNING FASTAPI ENDPOINTS VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] GET /health ->", res.json())

    # 2. Events endpoint
    res = client.get("/api/v1/events?limit=5")
    assert res.status_code == 200, f"Events endpoint failed: {res.text}"
    events = res.json()
    assert len(events) > 0, "No events returned"
    print(f"[PASS] GET /api/v1/events -> Retrieved {len(events)} events (Top event: {events[0]['label']})")

    # 3. Sites GeoJSON
    res = client.get("/api/v1/sites/geojson")
    assert res.status_code == 200, f"Sites GeoJSON failed: {res.text}"
    geojson = res.json()
    assert geojson["type"] == "FeatureCollection"
    print(f"[PASS] GET /api/v1/sites/geojson -> Retrieved FeatureCollection with {len(geojson['features'])} site features")

    # 4. Alerts queue
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200, f"Alerts queue failed: {res.text}"
    alerts = res.json()
    assert len(alerts) > 0, "No alerts returned"
    alert_id = alerts[0]["id"]
    print(f"[PASS] GET /api/v1/alerts -> Retrieved {len(alerts)} alerts (Top alert: {alerts[0]['title']})")

    # 5. Acknowledge alert
    res = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert res.status_code == 200, f"Acknowledge alert failed: {res.text}"
    ack_alert = res.json()
    assert ack_alert["status"] == "acknowledged"
    print(f"[PASS] PATCH /api/v1/alerts/{alert_id}/acknowledge -> Status updated to '{ack_alert['status']}'")

    # 6. Add comment to alert thread
    comment_payload = {"comment": "Priority verification: drone inspection confirmed flare deviation."}
    res = client.post(f"/api/v1/alerts/{alert_id}/comments", json=comment_payload)
    assert res.status_code == 200, f"Add comment failed: {res.text}"
    comment_data = res.json()
    assert "id" in comment_data
    print(f"[PASS] POST /api/v1/alerts/{alert_id}/comments -> Added comment by '{comment_data['author']}'")

    # 7. Audit log
    res = client.get("/api/v1/audit?limit=10")
    assert res.status_code == 200, f"Audit log failed: {res.text}"
    audit_trail = res.json()
    assert len(audit_trail) > 0
    print(f"[PASS] GET /api/v1/audit -> Retrieved {len(audit_trail)} audit records (Latest action: {audit_trail[-1]['action']})")

    # 8. Real-time Ad-hoc Classification
    classify_payload = {
        "latitude": 21.7125,
        "longitude": 72.5833,
        "brightness_temp": 382.4,
        "frp": 172.5,
        "confidence": "high",
        "site_name": "Dahej Chemical Complex",
        "site_type": "chemical",
        "land_cover_type": "industrial",
        "on_known_site": 1,
        "persistence_count": 2,
        "deviation_score": 4.6,
        "distance_to_site_km": 0.0,
    }
    res = client.post("/api/v1/classify", json=classify_payload)
    assert res.status_code == 200, f"Classify endpoint failed: {res.text}"
    classification = res.json()
    assert classification["label"] in ["industrial_fire", "unregistered_anomaly", "normal_flare"]
    print(f"[PASS] POST /api/v1/classify -> Label: '{classification['label']}', Confidence: {classification['confidence'] * 100:.1f}%, Severity: '{classification['severity']}'")
    print(f"       Explanation Summary: {classification['shap_explanation']['summary']}")

    print("=" * 70)
    print("ALL API ENDPOINTS VERIFIED AND PASSING SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    test_all_endpoints()
