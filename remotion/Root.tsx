import React from "react"
import "./style.css"
import {Composition, Folder} from "remotion"
import {defaultMyCompProps, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from "@/types/constants"
import {BarRace} from "@/remotion/charts/BarRace"

const baseProps = {
    durationInFrames: 60 * 10,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT
}


export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Folder name="Current">
                <Composition
                    id="bar-race"
                    component={BarRace}
                    {...baseProps}
                    fps={60}
                    durationInFrames={24 * 60}
                    defaultProps={defaultMyCompProps}
                />
            </Folder>
        </>
    )
}
