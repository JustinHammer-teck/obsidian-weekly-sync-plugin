import HighlightCommentPlugin from "@/main";
import { TFile } from "obsidian";
interface CommentData {
  text: string;
  start: number;
  end: number;
}

class CommentStorage {
  private plugin: HighlightCommentPlugin;
  private comments: { [filePath: string]: CommentData[] } = {};
  private storageFile: string = "";

  constructor(plugin: HighlightCommentPlugin) {
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
