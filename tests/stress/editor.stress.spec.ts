import { defineEditorStressTests } from './editorStressCase.ts';

defineEditorStressTests([100, 500, 1000], 90_000);
