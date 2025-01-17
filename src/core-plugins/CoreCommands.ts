import { sha } from "aliucord-version";
import { isPluginEnabled, plugins as installedPlugins } from "../api/PluginManager";
import { ApplicationCommandOptionType } from "../api/Commands";
import { Plugin } from "../entities/Plugin";
import { getByProps, i18n, MessageActions } from "../metro";
import { DebugInfo } from "../utils/debug/DebugInfo";
import { makeAsyncEval } from "../utils/misc";

export default class CoreCommands extends Plugin {
    start() {
        const ClydeUtils = getByProps("sendBotMessage");
        this.commands.registerCommand({
            name: "echo",
            description: "Creates a Clyde message",
            options: [
                {
                    name: "message",
                    description: i18n.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
                    required: true,
                    type: ApplicationCommandOptionType.STRING
                }
            ],
            execute: (args, ctx) => {
                ClydeUtils.sendBotMessage(ctx.channel.id, args[0].value);
            }
        });

        this.commands.registerCommand({
            name: "plugins",
            description: "Lists all installed Aliucord plugins",
            options: [],
            execute: (args, ctx) => {
                const enabledPlugins: string[] = [];
                const disabledPlugins: string[] = [];

                for (const plugin in installedPlugins) {
                    if (isPluginEnabled(plugin)) {
                        enabledPlugins.push(plugin);
                    } else {
                        disabledPlugins.push(plugin);
                    }
                }

                const plugins = `
                **Total plugins**: **${Object.keys(installedPlugins).length}**
                
                **Enabled plugins**: **${enabledPlugins.length}**
                > ${enabledPlugins.join(", ") ? enabledPlugins.join(", ") : "None."}
                
                **Disabled plugins**: **${disabledPlugins.length}**
                > ${disabledPlugins.join(", ") ? disabledPlugins.join(", ") : "None."}`;

                ClydeUtils.sendBotMessage(ctx.channel.id, plugins.replaceAll("    ", ""));
            }
        });

        this.commands.registerCommand({
            name: "eval",
            description: "Evaluate JavaScript",
            options: [
                {
                    name: "code",
                    description: "Code to eval. Async functions are not supported. Await is, however you must specify a return explicitly",
                    required: true,
                    type: ApplicationCommandOptionType.STRING
                }
            ],
            execute: async (args, ctx) => {
                try {
                    const code = args[0].value as string;

                    let result;
                    if (code.includes("await")) {
                        result = await (0, eval)(makeAsyncEval(code));
                    } else {
                        result = (0, eval)(code);
                    }

                    ClydeUtils.sendBotMessage(ctx.channel.id, this.codeblock(String(result)));
                } catch (err: any) {
                    ClydeUtils.sendBotMessage(ctx.channel.id, this.codeblock(err?.stack ?? err?.message ?? String(err)));
                }
            }
        });

        this.commands.registerCommand({
            name: "debug",
            description: "Posts debug info",
            options: [],
            execute: async (args, ctx) => {
                MessageActions.sendMessage(ctx.channel.id, {
                    content: `**Debug Info:**
                        > Discord: ${DebugInfo.discordVersion}
                        > Aliucord: ${sha} (${Object.keys(installedPlugins).length} plugins)
                        > System: ${DebugInfo.system}
                        > React: ${DebugInfo.reactVersion}
                        > Hermes: ${DebugInfo.hermesVersion}
                    `.replace(/^\s+/gm, "")
                });
            }
        });
    }

    private codeblock(code: string) {
        const ZWSP = "​";
        return "```js\n" + code.replace(/`/g, "`" + ZWSP) + "```";
    }
}
