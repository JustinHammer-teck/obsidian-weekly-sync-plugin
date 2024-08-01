import { Modal, App, Setting } from "obsidian";

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
