import { useEditor, EditorContent } from "@/lib/tiptap-preact";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { useCallback, useEffect, useRef } from "react";

const TEMPLATE_VARIABLES = [
  { name: "REP_NAME", label: "Rep Name", description: "Full name (e.g., John Smith)" },
  { name: "REP_TITLE", label: "Title", description: "Senator or Representative" },
  { name: "REP_FIRST", label: "First", description: "First name only" },
  { name: "REP_LAST", label: "Last", description: "Last name only" },
  { name: "REP_PARTY", label: "Party", description: "Political party (e.g., Democrat)" },
  { name: "STATE", label: "State", description: "State abbreviation (e.g., CA)" },
  { name: "DISTRICT", label: "District", description: "District number or At-Large" },
  { name: "USER_NAME", label: "Your Name", description: "Writer's name (from address)" },
  { name: "USER_CITY", label: "Your City", description: "Writer's city (from address)" },
  { name: "TODAY_DATE", label: "Date", description: "Today's date (e.g., January 1, 2024)" },
] as const;

const toolbarButtonClass =
  "p-2 rounded hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none";

const variableButtonClass =
  "px-2 py-1 text-xs rounded hover:bg-accent/20 text-primary font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showVariableButtons?: boolean;
  maxLength?: number;
  id?: string;
  "aria-invalid"?: "true" | "false";
  "aria-describedby"?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write your letter here...",
  showVariableButtons = true,
  maxLength,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: TiptapEditorProps) {
  const lastUserContent = useRef(content);

  const editor = useEditor({
    immediatelyRender: false,
    onCreate: ({ editor: e }) => {
      e.view.dom.dataset.editorReady = "true";
    },
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Markdown,
    ],
    content,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      lastUserContent.current = markdown;
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-editor w-full px-5 py-4 text-lg bg-white border-2 border-border rounded-md transition-all duration-300 placeholder:italic focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[200px] resize-y text-sm focus:outline-none prose prose-sm max-w-none",
        "data-testid": "tiptap-editor",
        ...(id && { id }),
        ...(ariaInvalid && { "aria-invalid": ariaInvalid }),
        ...(ariaDescribedBy && { "aria-describedby": ariaDescribedBy }),
      },
    },
  });

  useEffect(() => {
    if (editor && content !== lastUserContent.current) {
      editor.commands.setContent(content, { emitUpdate: false, contentType: "markdown" });
      lastUserContent.current = content;
    }
  }, [editor, content]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const insertVariable = useCallback(
    (varName: string) => {
      editor?.chain().focus().insertContent(`{{${varName}}}`).run();
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  const characterCount = editor.getText().length;

  return (
    <div className="tiptap-container">
      <div className="flex flex-wrap gap-1 mb-2 p-1 border border-border rounded-md bg-white">
        <button
          onClick={toggleBold}
          className={`${toolbarButtonClass} ${
            editor.isActive("bold") ? "bg-muted text-primary" : ""
          }`}
          type="button"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
          </svg>
        </button>

        <button
          onClick={toggleItalic}
          className={`${toolbarButtonClass} ${
            editor.isActive("italic") ? "bg-muted text-primary" : ""
          }`}
          type="button"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </svg>
        </button>

        <div className="w-px bg-gray-200 mx-1" />

        <button
          onClick={toggleBulletList}
          className={`${toolbarButtonClass} ${
            editor.isActive("bulletList") ? "bg-muted text-primary" : ""
          }`}
          type="button"
          title="Bullet List"
          aria-label="Bullet List"
          aria-pressed={editor.isActive("bulletList")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
        </button>

        <button
          onClick={toggleOrderedList}
          className={`${toolbarButtonClass} ${
            editor.isActive("orderedList") ? "bg-muted text-primary" : ""
          }`}
          type="button"
          title="Numbered List"
          aria-label="Numbered List"
          aria-pressed={editor.isActive("orderedList")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="10" x2="21" y1="6" y2="6" />
            <line x1="10" x2="21" y1="12" y2="12" />
            <line x1="10" x2="21" y1="18" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>

        {showVariableButtons && (
          <>
            <div className="w-px bg-gray-200 mx-1" />
            <span className="flex items-center px-2 text-xs text-muted-foreground">Insert:</span>
            {TEMPLATE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable.name)}
                className={variableButtonClass}
                type="button"
                title={variable.description}
                aria-label={`Insert ${variable.label} variable`}
              >
                {variable.label}
              </button>
            ))}
          </>
        )}
      </div>

      <EditorContent editor={editor} />

      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm text-muted-foreground mt-2">
        <span className="text-xs sm:text-sm">
          Variables like {"{{REP_NAME}}"} will be replaced with actual values
        </span>
        <span
          className={`text-xs sm:text-sm ${maxLength && characterCount > maxLength ? "text-red-500 font-medium" : ""}`}
        >
          <span className="font-medium" data-testid="character-count">
            {characterCount}
          </span>
          {maxLength ? ` / ${maxLength}` : ""} characters
          {maxLength && characterCount > maxLength && " (exceeds limit)"}
        </span>
      </div>
    </div>
  );
}
