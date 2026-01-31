'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'checking' | 'not_configured';
  message: string;
  required: boolean;
}

interface HealthMetrics {
  queue: {
    active: number;
    pending: number;
    completed: number;
    failed: number;
  };
  system: {
    uptime: number;
    uptimeFormatted: string;
    memoryUsed: number;
    memoryTotal: number;
    memoryPercent: number;
  };
  api: {
    errorRate: number;
    avgResponseTime: number;
  };
}

export default function StatusPage() {
  const params = useParams();
  const adminPrefix = params.adminPrefix as string;
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend API', status: 'checking', message: 'Checking...', required: true },
  ]);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    setApiUrl(url);

    // Check backend connection
    // Health endpoint is at root level, not under /api
    const baseUrl = url.replace(/\/api\/?$/, '');
    checkBackendHealth(baseUrl);
  }, []);

  const checkBackendHealth = async (baseUrl: string) => {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        setServices([
          {
            name: 'Backend API',
            status: 'connected',
            message: `Connected to ${baseUrl}`,
            required: true,
          },
          {
            name: 'Database (PostgreSQL)',
            status: data.database ? 'connected' : 'error',
            message: data.database ? 'Connected' : 'Not connected',
            required: true,
          },
          {
            name: 'Redis (Job Queue)',
            status: data.redis ? 'connected' : 'error',
            message: data.redis ? 'Connected' : 'Not connected - scraping jobs will not work',
            required: false,
          },
        ]);

        // Fetch health metrics if backend is connected
        try {
          const metrics = await apiClient.getAdminHealthMetrics();
          setHealthMetrics(metrics);
        } catch {
          // Health metrics endpoint might not be available yet
        }
      } else {
        setServices([
          {
            name: 'Backend API',
            status: 'error',
            message: `Backend returned status ${response.status}`,
            required: true,
          },
        ]);
      }
    } catch {
      setServices([
        {
          name: 'Backend API',
          status: 'error',
          message: `Cannot connect to backend at ${baseUrl}`,
          required: true,
        },
      ]);
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500 animate-pulse';
      case 'not_configured':
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      case 'checking':
        return 'Checking...';
      case 'not_configured':
        return 'Not Configured';
    }
  };

  const backendNotDeployed = services.some(
    (s) => s.name === 'Backend API' && s.status === 'error'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href={`/${adminPrefix}`}
          className="text-sm text-gray-400 hover:text-white transition-colors mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">System Status</h1>
        <p className="text-gray-400 mt-1">Check the status of all services and configuration</p>
      </div>

      {/* Service Status */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Service Status</h2>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                <div>
                  <p className="font-medium text-white">
                    {service.name}
                    {service.required && (
                      <span className="ml-2 text-xs text-red-400">(Required)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">{service.message}</p>
                </div>
              </div>
              <span
                className={`text-sm font-medium ${
                  service.status === 'connected'
                    ? 'text-green-400'
                    : service.status === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                {getStatusText(service.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Metrics */}
      {healthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Queue Stats */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Queue Stats (24h)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-xl font-bold text-yellow-400">{healthMetrics.queue.active}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-xl font-bold text-blue-400">{healthMetrics.queue.pending}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Completed</p>
                <p className="text-xl font-bold text-green-400">{healthMetrics.queue.completed}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Failed</p>
                <p className="text-xl font-bold text-red-400">{healthMetrics.queue.failed}</p>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              System Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white font-medium">{healthMetrics.system.uptimeFormatted}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-white font-medium">
                    {healthMetrics.system.memoryUsed}MB / {healthMetrics.system.memoryTotal}MB
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      healthMetrics.system.memoryPercent > 80
                        ? 'bg-red-500'
                        : healthMetrics.system.memoryPercent > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${healthMetrics.system.memoryPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* API Stats */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              API Stats (24h)
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Error Rate</p>
                <p className={`text-xl font-bold ${
                  healthMetrics.api.errorRate > 5 ? 'text-red-400' :
                  healthMetrics.api.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {healthMetrics.api.errorRate}%
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Avg Response Time</p>
                <p className="text-xl font-bold text-white">{healthMetrics.api.avgResponseTime}ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Configuration */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Current Configuration</h2>
        <div className="space-y-3">
          <ConfigItem
            name="NEXT_PUBLIC_API_URL"
            value={apiUrl}
            description="Backend API URL"
            status={apiUrl.includes('localhost') ? 'warning' : 'ok'}
          />
        </div>
      </div>

      {/* Setup Instructions */}
      {backendNotDeployed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">
            Backend Not Deployed
          </h2>
          <p className="text-gray-300 mb-4">
            The admin dashboard requires the backend API to be deployed. Follow these steps:
          </p>

          <div className="space-y-6">
            <SetupStep
              number={1}
              title="Create Backend Service on Railway"
              description="In your Railway project, create a new service and set the root directory to 'backend'"
            />

            <SetupStep
              number={2}
              title="Add PostgreSQL Database"
              description="Add a PostgreSQL plugin to your Railway project. Railway will automatically provide DATABASE_URL"
            />

            <SetupStep
              number={3}
              title="Add Redis (Optional)"
              description="Add Redis plugin for background job queue. Provides REDIS_URL automatically"
            />

            <SetupStep
              number={4}
              title="Configure Backend Environment Variables"
              description={
                <div className="mt-2 space-y-2">
                  <EnvVar name="DATABASE_URL" value="(auto-provided by Railway PostgreSQL)" required />
                  <EnvVar name="REDIS_URL" value="(auto-provided by Railway Redis)" />
                  <EnvVar name="JWT_SECRET" value="your-secure-random-string-here" required />
                  <EnvVar name="FRONTEND_URL" value="https://your-website-domain.railway.app" required />
                  <EnvVar name="PERPLEXITY_API_KEY" value="your-perplexity-api-key" />
                  <EnvVar name="SCRAPE_DELAY_MS" value="3000" />
                </div>
              }
            />

            <SetupStep
              number={5}
              title="Configure Frontend Environment Variable"
              description={
                <div className="mt-2">
                  <p className="text-gray-400 mb-2">
                    In your website service on Railway, add:
                  </p>
                  <EnvVar
                    name="NEXT_PUBLIC_API_URL"
                    value="https://your-backend-domain.railway.app/api"
                    required
                  />
                </div>
              }
            />

            <SetupStep
              number={6}
              title="Run Database Migrations"
              description="After deploying the backend, run: npx prisma migrate deploy && npx prisma db seed"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-light transition-colors"
        >
          Refresh Status
        </button>
        <a
          href="https://railway.app/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Open Railway Dashboard
        </a>
      </div>
    </div>
  );
}

function ConfigItem({
  name,
  value,
  description,
  status,
}: {
  name: string;
  value: string;
  description: string;
  status: 'ok' | 'warning' | 'error';
}) {
  return (
    <div className="p-4 bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <code className="text-sm font-mono text-accent">{name}</code>
        {status === 'warning' && (
          <span className="text-xs text-yellow-400">Using default/localhost</span>
        )}
      </div>
      <p className="text-sm text-white font-mono break-all">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function SetupStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        {typeof description === 'string' ? (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        ) : (
          description
        )}
      </div>
    </div>
  );
}

function EnvVar({
  name,
  value,
  required,
}: {
  name: string;
  value: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <code className="bg-gray-800 px-2 py-1 rounded text-accent font-mono">{name}</code>
      <span className="text-gray-500">=</span>
      <code className="bg-gray-800 px-2 py-1 rounded text-gray-300 font-mono break-all">
        {value}
      </code>
      {required && <span className="text-red-400 text-xs">*required</span>}
    </div>
  );
}
