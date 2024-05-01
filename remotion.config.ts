// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config"
import { enableTailwind } from "@remotion/tailwind"
import path from "path"

Config.overrideWebpackConfig((config) => {
  return {
    ...enableTailwind(config),
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "@/remotion": path.join(process.cwd(), "remotion"),
        "@/styles": path.join(process.cwd(), "styles"),
        "@/types": path.join(process.cwd(), "types"),
      },
    },
  }
})
Config.setConcurrency(1)
Config.setVideoImageFormat("png")
Config.setCodec("h264")
Config.setBeepOnFinish(true)
Config.setScale(2)
