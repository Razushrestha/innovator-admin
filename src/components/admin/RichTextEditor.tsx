'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Undo, Redo, Code, Quote,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label, error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Write something…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-gray-200 text-sm leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className={`border rounded-lg overflow-hidden ${error ? 'border-red-500' : 'border-gray-700'} bg-gray-800 focus-within:border-indigo-500 transition-colors`}>
        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-700 bg-gray-800/80">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <Bold size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <Italic size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 size={14} />
          </ToolBtn>
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
            <List size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
            <ListOrdered size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
            <Quote size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
            <Code size={14} />
          </ToolBtn>
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
            <Undo size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
            <Redo size={14} />
          </ToolBtn>
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
