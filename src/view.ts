import { ItemView, WorkspaceLeaf } from "obsidian";
import { createApp, App as VueApp } from "vue";
import App from "./App.vue";

export const VIEW_TYPE: string = "my-view";

export class ObsidianWeekSyncView extends ItemView {
  vueapp: VueApp;
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Vue Stater";
  }

  static getIcon(): string {
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
}
