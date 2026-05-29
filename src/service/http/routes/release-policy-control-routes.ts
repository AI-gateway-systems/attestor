import type { Hono } from 'hono';
import { registerReleasePolicyControlActivationRoutes } from './release-policy-control-activation-routes.js';
import { registerReleasePolicyControlEmergencyRoutes } from './release-policy-control-emergency-routes.js';
import { registerReleasePolicyControlPackRoutes } from './release-policy-control-pack-routes.js';
import type { ReleasePolicyControlRouteDeps } from './release-policy-control-route-context.js';
import { registerReleasePolicyControlReadRoutes } from './release-policy-control-read-routes.js';
import { registerReleasePolicyControlSimulationRoutes } from './release-policy-control-simulation-routes.js';

export type { ReleasePolicyControlRouteDeps } from './release-policy-control-route-context.js';

export function registerReleasePolicyControlRoutes(app: Hono, deps: ReleasePolicyControlRouteDeps): void {
  registerReleasePolicyControlReadRoutes(app, deps);
  registerReleasePolicyControlPackRoutes(app, deps);
  registerReleasePolicyControlActivationRoutes(app, deps);
  registerReleasePolicyControlEmergencyRoutes(app, deps);
  registerReleasePolicyControlSimulationRoutes(app, deps);
}
