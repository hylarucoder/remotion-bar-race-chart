import { z } from "zod"

export const CompositionProps = z.object({
  title: z.string(),
})

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Next.js and Remotion",
}

export const DURATION_IN_FRAMES = 200
export const VIDEO_WIDTH = 1920
export const VIDEO_HEIGHT = 1080
export const VIDEO_FPS = 30
export const COMP_NAME = "ds-current"
