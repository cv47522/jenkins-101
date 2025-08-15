# Health check
curl http://localhost:3000/health

# API endpoint
curl http://localhost:3000/api/hello

# POST endpoint
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'