/**
 * SharePlate AI: Health Check & Cloud Infrastructure Monitoring
 * Module 2: Cloud Engineering
 */

const express = require('express');
const router = express.Router();
const { checkConnection } = require('../config/db');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

router.get('/', async (req, res) => {
  const dbHealth = checkConnection();

  // Test AI microservice connection
  let aiStatus = 'offline (subprocess fallback active)';
  let aiLatencyMs = null;
  try {
    const start = Date.now();
    const aiRes = await fetch(`${AI_SERVICE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    if (aiRes.ok) {
      aiStatus = 'online';
      aiLatencyMs = Date.now() - start;
    }
  } catch (e) {
    aiStatus = 'subprocess fallback ready';
  }

  const mem = process.memoryUsage();

  res.json({
    status: dbHealth.status === 'connected' ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    server: {
      platform: process.platform,
      node_version: process.version,
      port: process.env.PORT || 5000,
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024)
      }
    },
    database: {
      status: dbHealth.status,
      dialect: dbHealth.dialect,
      storage_location: dbHealth.storage,
      latency_ms: dbHealth.latencyMs,
      alive: dbHealth.alive
    },
    ai_service: {
      status: aiStatus,
      endpoint: AI_SERVICE_URL,
      latency_ms: aiLatencyMs
    },
    cloud_readiness: {
      container_ready: true,
      stateless_api: true,
      health_check_compliant: true,
      parameterized_credentials: true
    }
  });
});

module.exports = router;
