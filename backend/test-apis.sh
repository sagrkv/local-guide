#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWwxM3p6bGkwMDAwa2JpZXZsdml1YWVkIiwiZW1haWwiOiJhZG1pbkBsZWVkby5pbyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2OTc5MTk0MSwiZXhwIjoxNzcwMzk2NzQxfQ.RckJwby1Zp2hZCQIRpHDzKJG1Z97hvDP7pZrHQ1S43s"
BASE="http://localhost:3001/api"
AUTH="Authorization: Bearer $TOKEN"
ADMIN_PREFIX="nucleus-admin-x7k9m2"

pass=0
fail=0

test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local desc=$4

  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" -H "$AUTH" -H "Content-Type: application/json" -d "$data" "$BASE$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" -H "$AUTH" "$BASE$endpoint")
  fi

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" =~ ^2 ]]; then
    echo "✅ $method $endpoint ($desc)"
    ((pass++))
    echo "$body"
  else
    echo "❌ $method $endpoint ($desc) - HTTP $http_code"
    echo "   Response: ${body:0:150}"
    ((fail++))
  fi
}

echo "=========================================="
echo "       LEEDO API TEST SUITE (FULL)"
echo "=========================================="

echo ""
echo "=== 1. AUTH ENDPOINTS ==="
test_api GET "/auth/me" "" "Get current user"

echo ""
echo "=== 2. DASHBOARD ==="
test_api GET "/dashboard/stats" "" "Get dashboard stats"

echo ""
echo "=== 3. LEADS ==="
test_api GET "/leads" "" "List leads"
test_api GET "/leads?limit=5&stage=NEW" "" "List leads with filters"

echo ""
echo "=== 4. CREDITS ==="
test_api GET "/credits/balance" "" "Get credit balance"
test_api GET "/credits/history" "" "Get credit history"

echo ""
echo "=== 5. TAGS ==="
test_api GET "/tags" "" "List tags"
test_api POST "/tags" '{"name":"Test Tag","color":"#ff0000"}' "Create tag"

echo ""
echo "=== 6. REGIONS (Admin Scraping Zones) ==="
test_api GET "/regions" "" "List regions"

echo ""
echo "=== 7. SAVED REGIONS (User Map Bounds) ==="
test_api GET "/saved-regions" "" "List saved regions"
test_api GET "/saved-regions/recent" "" "Get recent regions"
test_api POST "/saved-regions" '{"name":"Test Region","southwestLat":12.9,"southwestLng":77.5,"northeastLat":13.0,"northeastLng":77.7}' "Create saved region"

echo ""
echo "=== 8. SCRAPING ==="
test_api GET "/scraping/jobs" "" "List scrape jobs"
test_api GET "/scraping/stats" "" "Get scraping stats"

echo ""
echo "=== 9. ACTIVITIES ==="
test_api GET "/activities" "" "List activities"

echo ""
echo "=== 10. PROSPECTS ==="
test_api GET "/prospects" "" "List prospects"

echo ""
echo "=== 11. ADMIN ENDPOINTS ==="
test_api GET "/admin/coupons" "" "List coupons (admin)"
test_api GET "/$ADMIN_PREFIX/audit-logs" "" "Get audit logs (admin)"
test_api GET "/$ADMIN_PREFIX/users" "" "List users (admin)"
test_api GET "/$ADMIN_PREFIX/analytics/overview" "" "Get analytics (admin)"

echo ""
echo "=========================================="
echo "Results: $pass passed, $fail failed"
echo "=========================================="

# Cleanup: Delete test tag
echo ""
echo "Cleaning up test data..."
