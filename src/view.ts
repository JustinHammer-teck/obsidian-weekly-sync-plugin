import {
  debounce,
  ItemView,
  MarkdownRenderer,
  MarkdownView,
  Modal,
  Setting,
  WorkspaceLeaf,
  App as ObsidianApp,
} from "obsidian";
import { createApp, App as VueApp } from "vue";
import App from "./App.vue";

export const VIEW_TYPE: string = "plugin-view";
class CommentModal extends Modal {
  comment: string;
  onSubmit: (result: string) => void;

  constructor(app: ObsidianApp, onSubmit: (result: string) => void) {
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
export class ObsidianWeekSyncView extends ItemView {
  private readonly renderDebounceInterval = 1000; // 1 second debounce

  vueapp: VueApp;
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    console.log("started");
    this.renderHighlights = this.renderHighlights.bind(this);
    this.debouncedRender = this.debouncedRender.bind(this);
    this.renderAllVisibleLeaves = this.renderAllVisibleLeaves.bind(this);
    this.renderLeaf = this.renderLeaf.bind(this);
    this.registerEvent(
      this.app.workspace.on("layout-change", this.debouncedRender),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", this.debouncedRender),
    );
    this.registerEvent(
      this.app.workspace.on("quick-preview", this.debouncedRender),
    );
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Vue Stater";
  }

  getIcon(): string {
    return "tent-tree";
  }

  async onOpen() {
    const container = this.containerEl;
    container.empty();

    let content = container.createEl("div", {
      cls: "my-plugin-view",
    });

    this.vueapp = createApp(App);
    this.vueapp.mount(content);
  }
  async onClose() {
    this.vueapp.unmount();
  }
  debouncedRender = debounce(
    () => {
      this.renderAllVisibleLeaves();
    },
    this.renderDebounceInterval,
    true,
  );

  renderAllVisibleLeaves() {
    this.app.workspace.iterateRootLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        this.renderLeaf(leaf);
        console.log("this worked");
      }
    });
  }
  async renderLeaf(leaf: WorkspaceLeaf) {
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) return;

    const file = view.file;
    if (!file) return;

    const content = await this.app.vault.cachedRead(file);
    const contentEl = view.contentEl;
    console.log(contentEl);
    // const previewEl = contentEl.querySelector(".markdown-preview-view");
    // if (!previewEl) return;

    // await this.renderHighlights(previewEl, content, file.path);
  }

  async renderHighlights(el: HTMLElement, content: string, sourcePath: string) {
    console.log("re-render");
    const highlightRegex =
      /%%highlight-start%%([\s\S]*?)%%highlight-end%%%%comment-start%%([\s\S]*?)%%comment-end%%/g;

    let match;
    let lastIndex = 0;
    const fragments = [];

    while ((match = highlightRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const normalText = content.slice(lastIndex, match.index);
        const normalEl = document.createElement("span");
        await MarkdownRenderer.renderMarkdown(
          normalText,
          normalEl,
          sourcePath,
          this,
        );
        fragments.push(normalEl);
      }

      const highlightSpan = document.createElement("span");
      highlightSpan.addClass("highlight-comment");
      await MarkdownRenderer.renderMarkdown(
        match[1],
        highlightSpan,
        sourcePath,
        this,
      );

      const tooltipSpan = document.createElement("span");
      tooltipSpan.addClass("tooltip");
      tooltipSpan.textContent = match[2]; // Comment text

      highlightSpan.appendChild(tooltipSpan);
      fragments.push(highlightSpan);

      lastIndex = highlightRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      const normalText = content.slice(lastIndex);
      const normalEl = document.createElement("span");
      await MarkdownRenderer.renderMarkdown(
        normalText,
        normalEl,
        sourcePath,
        this,
      );
      fragments.push(normalEl);
    }

    el.empty();
    fragments.forEach((fragment) => el.appendChild(fragment));
  }
}
