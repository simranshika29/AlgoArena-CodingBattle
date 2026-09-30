import React from 'react';
import Editor from '@monaco-editor/react';
import { Language } from '../api/types';
import { LANGUAGES } from '../utils/languages';
import { LoadingState } from './StatusViews';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: number | string;
}

/** Monaco editor. Loaded lazily by the pages that use it, so it isn't in the main bundle. */
const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, readOnly = false, height = '100%' }) => (
  <Editor
    height={height}
    language={LANGUAGES[language].monaco}
    value={value}
    onChange={(next) => onChange(next ?? '')}
    theme="vs-dark"
    loading={<LoadingState label="Loading editor…" minHeight={200} />}
    options={{
      readOnly,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", Consolas, monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      padding: { top: 12 },
      renderLineHighlight: 'line',
    }}
  />
);

export default CodeEditor;
