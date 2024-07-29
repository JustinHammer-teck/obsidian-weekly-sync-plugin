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

              // Store the comment
              // this.commentStorage.addComment(view.file, {
              //   text: comment,
              //   start: editor.posToOffset(editor.getCursor("from")),
              //   end: editor.posToOffset(editor.getCursor("to")),
              // });
            }
          }).open();
        } else {
          new Notice("Please select some text to highlight and comment.");
        }
      },
    });

    // Register events to trigger rendering
    //   this.registerEvent(
    //     this.app.workspace.on("quick-preview", this.triggerRender),
    //   );
    //   this.registerEvent(this.app.workspace.on("file-open", this.triggerRender));
    //   this.registerEvent(
    //     this.app.workspace.on("layout-change", this.triggerRender),
    //   );
    this.refresh();
  }

  refresh = () => {
    this.updateDocumentBody();
  };

  updateDocumentBody = () => {
    document.body.classList.toggle("obsidian-wk-sync", true);
  };

  triggerRender = () => {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      this.renderHighlightsAndComments(activeView);
    }
  };

  async renderHighlightsAndComments(view: MarkdownView) {
    console.log("Rendering");
    const file = view.file;
    if (!file) return;

    const content = await this.app.vault.cachedRead(file);
    const storedComments = this.commentStorage.getComments(file);

    const previewEl = view.previewMode.containerEl;
    // Process inline highlights and comments
    const highlightRegex = /%%highlight-start%%([\s\S]*?)%%highlight-end%%/g;
    const commentRegex = /%%comment-start%%([\s\S]*?)%%comment-end%%/g;

    previewEl.innerHTML = previewEl.innerHTML.replace(
      highlightRegex,
      (match, p1) => {
        return `<span class="custom-highlight">${p1}</span>`;
      },
    );

    previewEl.innerHTML = previewEl.innerHTML.replace(
      commentRegex,
      (match, p1) => {
        return `<span class="custom-comment">${p1}</span>`;
      },
    );

    // Process stored comments
    const doc = new DOMParser().parseFromString(
      previewEl.innerHTML,
      "text/html",
    );
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);

    let node;
    let offset = 0;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      for (const comment of storedComments) {
        if (offset <= comment.start && comment.end <= offset + text.length) {
          const range = document.createRange();
          range.setStart(node, comment.start - offset);
          range.setEnd(node, comment.end - offset);

          const span = document.createElement("span");
          span.className = "custom-highlight";
          range.surroundContents(span);

          const commentIcon = document.createElement("span");
          commentIcon.className = "custom-comment-icon";
          commentIcon.textContent = "💬";
          commentIcon.title = comment.text;
          span.appendChild(commentIcon);

          walker.currentNode = span;
          break;
        }
      }
      offset += text.length;
    }

    previewEl.innerHTML = doc.body.innerHTML;
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
