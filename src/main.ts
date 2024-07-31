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
              const replacement = `<label class="ob-wk-sync">${selection}<input type="checkbox"><span>${comment}</span> </label>`;
              editor.replaceSelection(replacement);
            }
          }).open();
        } else {
          new Notice("Please select some text to highlight and comment.");
        }
      },
    });
  }
}

class CommentStorage {
  private plugin: Plugin;
  private comments: { [filePath: string]: CommentData[] } = {};
  private storageFile: string = "";

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
