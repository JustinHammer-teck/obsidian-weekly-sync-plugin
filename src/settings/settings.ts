import { App as ObsidianApp, Setting, PluginSettingTab } from "obsidian";
import ObsidianWeeklySync from "@/HighlightCommentPlugin";

export default class SettingTab extends PluginSettingTab {
  plugin: ObsidianWeeklySync;

  constructor(app: ObsidianApp, plugin: ObsidianWeeklySync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.pluginSetting)
          .onChange(async (value) => {
            this.plugin.settings.pluginSetting = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
