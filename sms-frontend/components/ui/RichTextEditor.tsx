'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import react-quill-new to avoid SSR and React 19 findDOMNode issues
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 8 }}></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  
  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  }), []);

  return (
    <div className="rich-text-editor-container">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || 'Write your description here...'}
      />
      <style dangerouslySetInnerHTML={{__html: `
        .rich-text-editor-container .quill {
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border-radius: 8px;
          border: 1px solid var(--color-border);
          overflow: hidden;
        }
        .rich-text-editor-container .ql-toolbar {
          border: none;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-2);
          font-family: inherit;
        }
        .rich-text-editor-container .ql-container {
          border: none;
          font-family: inherit;
          font-size: 0.95rem;
          min-height: 150px;
          max-height: 300px;
          overflow-y: auto;
          color: var(--color-text);
        }
        .rich-text-editor-container .ql-editor {
          padding: 1rem;
        }
        .rich-text-editor-container .ql-editor p {
          margin-bottom: 0.5rem;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: var(--color-text-muted);
          font-style: normal;
        }
        .rich-text-editor-container .ql-snow .ql-stroke {
          stroke: var(--color-text-secondary);
        }
        .rich-text-editor-container .ql-snow .ql-fill, .rich-text-editor-container .ql-snow .ql-stroke.ql-fill {
          fill: var(--color-text-secondary);
        }
        .rich-text-editor-container .ql-snow .ql-picker {
          color: var(--color-text-secondary);
        }
      `}} />
    </div>
  );
}
