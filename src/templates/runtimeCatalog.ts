import { TemplatePackageService } from '../application/templates/TemplatePackageService.ts';
import { TemplateRegistry } from '../application/templates/TemplateRegistry.ts';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import { builtinTemplateEntries } from './catalog.ts';

export const templateRegistry = new TemplateRegistry();
templateRegistry.registerMany(builtinTemplateEntries);

export const templatePackageService = new TemplatePackageService(templateRegistry, {
  get: key => workspaceService.getSetting(key),
  set: (key, value) => workspaceService.setSetting(key, value),
  remove: key => workspaceService.removeSetting(key),
});
