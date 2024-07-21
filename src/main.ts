import {
  App as ObsidianApp,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  Menu,
} from "obsidian";

import { ObsidianWeekSyncView, VIEW_TYPE } from "./view";
import SettingTab from "./settings/settings";

// Remember to rename these classes and interfaces!
interface PluginSettings {
  pluginSetting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  pluginSetting: "default",
};

export default class ObsidianWeeklySync extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("Status Bar Text");

    this.registerView(VIEW_TYPE, (leaf) => new ObsidianWeekSyncView(leaf));

    this.addRibbonIcon("tent-tree", "Weekly View", (evt) => {
      this.activateView();
    });

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "open-sample-modal-simple",
      name: "Open sample modal (simple)",
      callback: () => {
        new PluginModal(this.app).open();
      },
    });

    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "sample-editor-command",
      name: "Sample editor command",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection());
        editor.replaceSelection("Sample Editor Command");
      },
    });

    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: "open-sample-modal-complex",
      name: "Open sample modal (complex)",
      checkCallback: (checking: boolean) => {
        // Conditions to check

        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new PluginModal(this.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt);
      const activeLeaf = this.app.workspace.getLeaf();
      if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
        const editor = activeLeaf.view.editor;

        // Get the current selection
        const selection = editor.getSelection();

        // Print the selected text to the console
        console.log("Selected Text:", selection);
      }
    });

    this.addContextMenu();

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
    );
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length === 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE,
        active: true,
      });
    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0],
    );
  }

  addContextMenu() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        // Add a custom menu item
        menu.addItem((item) => {
          item
            .setTitle("Custom Action")
            .setIcon("dice")
            .onClick(() => {
              // Get the cursor position
              const cursor = editor.getCursor();
              console.log("Custom Action Clicked at:", cursor);

              // Perform your custom action here
              const selection = editor.getSelection();
              console.log("Selected Text:", selection);
              // Add your action here
            });
        });
      }),
    );
  }
}

class PluginModal extends Modal {
  constructor(app: ObsidianApp) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Woah!");
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
