import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance, Props as TippyProps } from "tippy.js";
import { CommandsList } from "./CommandsList";
import { 
  Heading1, Heading2, Heading3, 
  Text, List, ListOrdered, 
  CheckSquare, Code, Image, 
  Quote 
} from "lucide-react";

export const suggestion = {
  items: ({ query }: { query: string }) => {
    const searchQuery = (query || "").toLowerCase().trim();
    const allItems = [
      {
        title: "Heading 1",
        description: "Big section heading",
        icon: <Heading1 className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: <Heading2 className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
      },
      {
        title: "Heading 3",
        description: "Small section heading",
        icon: <Heading3 className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
        },
      },
      {
        title: "Text",
        description: "Just start typing with plain text",
        icon: <Text className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode("paragraph").run();
        },
      },
      {
        title: "Bullet List",
        description: "Create a simple bullet list",
        icon: <List className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered List",
        description: "Create a list with numbering",
        icon: <ListOrdered className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "Todo List",
        description: "Track tasks with a todo list",
        icon: <CheckSquare className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: "Code Block",
        description: "Capture a code snippet",
        icon: <Code className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: "Image",
        description: "Upload an image",
        icon: <Image className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          const url = window.prompt("Enter image URL");
          if (url) {
            editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
          }
        },
      },
      {
        title: "Quote",
        description: "Capture a quotation",
        icon: <Quote className="w-4 h-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
    ];
    
    if (!searchQuery) {
      return allItems.slice(0, 10);
    }
    
    return allItems
      .filter(item => item.title.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery))
      .slice(0, 10);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: TippyInstance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        } as Partial<TippyProps>);
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }

        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
