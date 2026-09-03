import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

// The post composer's formatting toolbar — bold, italic, strikethrough,
// inline code, and links. Deliberately NOT a full document editor: no
// headings, lists, blockquotes, or block code, since posts here are short
// social updates, not documents. #hashtags and @mentions are plain text
// as you type (this editor doesn't live-highlight them the way the old
// plain textarea did) — they still get turned into real links once
// posted, by the backend's lib/richText.js, from whatever plain text
// `getText()` reports below.
//
// No reset-from-parent prop: both callers (CreatePage, and FeedCard's edit
// form) unmount this component entirely once they're done with it —
// CreatePage navigates away on a successful post, and FeedCard's edit form
// only renders this while isEditing is true, so a fresh instance (and a
// fresh initial `content`) is mounted each time editing starts. There's no
// live scenario that needs the editor's content swapped out from under it
// while it stays mounted, so `content` is only ever read on first mount —
// changing it on an already-mounted instance has no effect, by design.
// Calling editor.getText()/commands from an effect during mount is also
// what used to crash here — the editor object can render before its
// ProseMirror view/schema is fully attached (EditorContent mounts that
// separately) — so this component only ever reacts to the user's own typing.
export default function RichTextEditor({ content, onChange, placeholder, autoFocus }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: { class: "app-richtext-content" },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({ html: ed.getHTML(), text: ed.getText() });
    },
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", previousUrl);
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const buttons = [
    { name: "bold", label: "Bold", glyph: "B", run: () => editor.chain().focus().toggleBold().run() },
    { name: "italic", label: "Italic", glyph: "i", run: () => editor.chain().focus().toggleItalic().run() },
    { name: "strike", label: "Strikethrough", glyph: "S", run: () => editor.chain().focus().toggleStrike().run() },
    { name: "code", label: "Code", glyph: "</>", run: () => editor.chain().focus().toggleCode().run() },
    { name: "link", label: "Link", glyph: "🔗", run: setLink },
  ];

  return (
    <div className="app-richtext-wrap">
      <div className="app-richtext-toolbar" role="toolbar" aria-label="Formatting">
        {buttons.map((b) => (
          <button
            key={b.name}
            type="button"
            className={"app-richtext-btn" + (editor.isActive(b.name) ? " is-active" : "")}
            onClick={b.run}
            aria-label={b.label}
            aria-pressed={editor.isActive(b.name)}
          >
            {b.glyph}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
