import {
  Plugin,
  Editor,
  MarkdownView,
  MarkdownPostProcessorContext,
  Setting,
  Modal,
  App,
  debounce,
  EditorPosition,
} from "obsidian";

interface HighlightComment {
  comment: string;
  sourcePath: string;
  position: {
    start: { line: number; ch: number };
    end: { line: number; ch: number };
  };
  text: string;
}

class CommentModal extends Modal {
  comment: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Enter your comment" });

    new Setting(contentEl).setName("Comment").addText((text) =>
      text.onChange((value) => {
        this.comment = value;
      }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Submit")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.comment);
        }),
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
export default class HighlightCommentPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "add-highlight-comment",
      name: "Add Highlight and Comment",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
          const from = editor.getCursor("from");
          const to = editor.getCursor("to");
          new CommentModal(this.app, async (comment) => {
            if (comment) {
              await this.saveHighlightComment(
                comment,
                view.file.path,
                from,
                to,
                selection,
              );

              // We no longer insert a signature in the markdown
              editor.replaceSelection(selection);
            }
          }).open();
        }
      },
    });

    this.registerMarkdownPostProcessor(this.debounced.bind(this));
  }

  async loadHighlightComments(): Promise<HighlightComment[]> {
    try {
      const data = await this.app.vault.adapter.read(
        ".obsidian/plugins/obsidian-weekly-sync/data.json",
      );
      console.log(data);
      return JSON.parse(data) || []; // Return an empty array if parsing results in null or undefined
    } catch (error) {
      console.log("Error loading highlight comments:", error);
      return []; // Return an empty array if file doesn't exist or there's an error
    }
  }

  async saveHighlightComment(
    comment: string,
    sourcePath: string,
    from: EditorPosition,
    to: EditorPosition,
    text: string,
  ): Promise<void> {
    let highlightComments = await this.loadHighlightComments();

    if (!Array.isArray(highlightComments)) {
      highlightComments = [];
    }

    highlightComments.push({
      comment,
      sourcePath,
      position: { start: from, end: to },
      text,
    });

    try {
      await this.app.vault.adapter.write(
        ".obsidian/plugins/obsidian-weekly-sync/data.json",
        JSON.stringify(highlightComments, null, 2),
      );
    } catch (error) {
      console.error("Error saving highlight comment:", error);
    }
  }

  debounced = debounce(function () {
    this.postProcessor();
  }, 1000);

  async postProcessor() {
    let active_leaf = this.app.workspace.getActiveFile();
    if (active_leaf) {
      let page_content = await this.app.vault.read(active_leaf);
      // Convert into HTML element
      let page_html = document.createElement("Div");
      page_html.innerHTML = page_content;
      // Use HTML parser to find the desired elements
      // Get all .ob-comment elements
      const highlightComments = await this.loadHighlightComments();

      let comment_list = page_html
        .querySelectorAll<HTMLElement>("hl-comment")
        .forEach((hlEl) => {
          console.log(hlEl);
        });
    }
  }
}
