import { createBackendModule } from "@backstage/backend-plugin-api";
import { scaffolderActionsExtensionPoint  } from '@backstage/plugin-scaffolder-node/alpha';
import { createNewFileAction } from "./actions/example";
import { trFetchTemplate } from "./actions/tr-fetch-template";

/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderModuleExtension = createBackendModule({
  pluginId: 'scaffolder', // name of the plugin that the module is targeting
  moduleId: 'custom-extensions',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint
      },
      async init({ scaffolderActions}) {
        scaffolderActions.addActions(createNewFileAction());
        scaffolderActions.addActions(trFetchTemplate());
      }
    });
  },
})
