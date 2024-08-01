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

export default class HighlightCommentPlugin extends Plugin {
  private commentStorage: CommentStorage;

  async onload() {
    this.commentStorage = new CommentStorage(this);
    await this.onloadInternal();
  }

  async onloadInternal() {
    this.loadCommands();
  }

  async loadCommands() {
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

  async loadEvent() {}

  loadSetting() {}
}
