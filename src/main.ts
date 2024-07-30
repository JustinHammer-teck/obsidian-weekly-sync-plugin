import {
  Plugin,
  MarkdownView,
  Editor,
  TFile,
  Notice,
  Modal,
  Setting,
  App,
} from "obsidian";

interface CommentData {
  text: string;
  start: number;
  end: number;
}

class CommentModal extends Modal {
  comment: string;
  selection: string;
  onSubmit: (comment: string) => void;

  constructor(
    app: App,
    selection: string,
    onSubmit: (comment: string) => void,
  ) {
    super(app);
    this.selection = selection;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Add a comment" });

    contentEl.createEl("p", {
      text: "Selected text:",
      cls: "comment-modal-label",
    });
    contentEl.createEl("div", {
      text: this.selection,
      cls: "comment-modal-selection",
    });

    new Setting(contentEl).setName("Comment").addTextArea((text) =>
      text.onChange((value) => {
        this.comment = value;
      }),
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Add Comment")
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
  private commentStorage: CommentStorage;

  async onload() {
    this.commentStorage = new CommentStorage(this);

    this.addCommand({
      id: "add-highlight-comment",
      name: "Add Highlight and Comment",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
          new CommentModal(this.app, selection, (comment) => {
            if (comment) {
              const replacement = `<highlighter>${selection}</highlighter><hglt-comment>${comment}</hglt-comment>`;
              editor.replaceSelection(replacement);
            }
          }).open();
        } else {
          new Notice("Please select some text to highlight and comment.");
        }
      },
    });

    const style = document.createElement("style");
    style.id = "my-plugin-styles";
    style.textContent = `
            .ob-wk-sync {
                position: relative;
                display: inline;
                cursor: pointer;
                background-color: rgba(255, 200, 200, 0.3);
                padding: 2px 0;
                border-radius: 3px;
                transition: background-color 0.3s ease;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }

            .ob-wk-sync:hover {
                background-color: rgba(255, 200, 200, 0.5);
            }

            .ob-wk-sync input[type="checkbox"] {
                display: none;
            }

            .ob-wk-sync span {
                visibility: hidden;
                width: 200px;
                background-color: #555;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                margin-left: -100px;
                opacity: 0;
                transition: opacity 0.3s, visibility 0.3s;
            }

            .ob-wk-sync span::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #555 transparent transparent transparent;
            }

            .ob-wk-sync input[type="checkbox"]:checked ~ span {
                visibility: visible;
                opacity: 1;
            }
        `;
    document.head.appendChild(style);
  }

  onunload() {
    // Remove the CSS when the plugin is disabled
    const style = document.getElementById("my-plugin-styles");
    if (style) style.remove();
  }
}

class CommentStorage {
  private plugin: Plugin;
  private comments: { [filePath: string]: CommentData[] } = {};
  private storageFile: string = ".obsidian/plugin-comments.json";

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.loadComments();
  }

  async loadComments() {
    const adapter = this.plugin.app.vault.adapter;
    if (await adapter.exists(this.storageFile)) {
      const data = await adapter.read(this.storageFile);
      this.comments = JSON.parse(data);
    }
  }

  async saveComments() {
    const adapter = this.plugin.app.vault.adapter;
    await adapter.write(this.storageFile, JSON.stringify(this.comments));
  }

  addComment(file: TFile, comment: CommentData) {
    if (!this.comments[file.path]) {
      this.comments[file.path] = [];
    }
    this.comments[file.path].push(comment);
    this.saveComments();
  }

  getComments(file: TFile): CommentData[] {
    return this.comments[file.path] || [];
  }
}
