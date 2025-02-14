import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';

import { ExampleCostInsightsClient  } from '@backstage-community/plugin-cost-insights';
import { costInsightsApiRef } from '@backstage-community/plugin-cost-insights';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: costInsightsApiRef, // Certifique-se de importar costInsightsApiRef
    deps: {},
    factory: () => new ExampleCostInsightsClient(),
  }),  
];
