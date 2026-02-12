import { Editor, type EditorOptions } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";

type UseEditorOptions = Partial<EditorOptions> & {
  immediatelyRender?: boolean;
};

export function useEditor(options: UseEditorOptions): Editor | null {
  const [editor, setEditor] = useState<Editor | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const { immediatelyRender: _, ...editorOptions } = optionsRef.current;
    const instance = new Editor(editorOptions);
    setEditor(instance);
    return () => {
      instance.destroy();
    };
  }, []);

  return editor;
}

interface EditorContentProps {
  editor: Editor | null;
  className?: string;
}

export function EditorContent({ editor, className }: EditorContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!editor || !containerRef.current || mounted.current) return;

    const editorDom = editor.view.dom;
    if (editorDom.parentNode) {
      containerRef.current.append(...editorDom.parentNode.childNodes);
    }
    editor.setOptions({ element: containerRef.current });
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, [editor]);

  return <div ref={containerRef} className={className} />;
}
