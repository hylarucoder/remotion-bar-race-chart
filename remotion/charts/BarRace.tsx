import {
    AbsoluteFill,
    continueRender,
    delayRender,
    Easing,
    interpolate,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from "remotion"
import React, {useEffect, useState} from "react"
import * as d3 from "d3"


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const BarChartKeyFrames = (
    {
        colorByName,
        keyframes,
    }: {
        colorByName: Map<string, string>,
        keyframes: any[]
    },
) => {
    const frame = useCurrentFrame()
    const {fps} = useVideoConfig()
    const curKeyframe = keyframes[Math.floor(frame / fps * 10)] || keyframes[keyframes.length - 1]
    const nextKeyframe = keyframes[Math.floor(frame / fps * 10) + 1] || keyframes[keyframes.length - 1]
    const prevItems = curKeyframe[1]
    const nextItems = nextKeyframe[1]
    const progress = interpolate(
        frame % fps, // 每30帧闪烁一次
        [0, fps],
        [0, 1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.linear,
        },
    )
    const slideProgress = interpolate(
        frame % fps, // 每30帧闪烁一次
        [0, fps],
        [0, 1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.cubic,
        },
    )
    console.log("stats --->", curKeyframe[0].getFullYear(), nextKeyframe[0].getFullYear())
    // 分析 curKeyframe 的 最大值
    const maxValue = Math.max(...prevItems.map(x => x.value), ...nextItems.map(x => x.value))
    const maxWidth = 1000 // maybe smaller
    // const widthPerValue = 1000 / maxValue

    const rectangles = prevItems.slice(0, 12).map((prevItem, idx) => {
        const nextItem = nextItems.filter(item => item.name === prevItem.name)[0]
        const width = (1000 * prevItem.value / maxValue) + (1000 * (nextItem.value - prevItem.value) / maxValue) * progress
        const prevY = 21 + 48 * prevItem.rank
        const nextY = 21 + 48 * nextItem.rank
        const curY = prevY + (nextY - prevY) * slideProgress
        console.log("rect rank", "prev rank", prevItem.rank, nextItem.rank, prevY, nextY, curY, prevItem)
        return ({color: colorByName.get(prevItem.name), width, y: curY})
    })

    function getTickPositions(scale, maxWidth) {
        const tickCount = maxWidth / 300
        const ticks = scale.ticks(tickCount)
        return ticks.map(t => ({
            value: t,
            position: scale(t),
        }))
    }

    const xScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, maxWidth])
    const tickPositions = getTickPositions(xScale, maxWidth)
    const ticks = tickPositions.map((x, i) => {
        return {
            transform: `translate(${x.position}, 0)`,
            text: x.value,
            textY: -3,
            lineStroke: i === 0 ? "currentColor" : "white",
        }
    })


    const textData = prevItems.slice(0, 12).map((prevItem, idx) => {
        const nextItem = nextItems.filter(item => item.name === prevItem.name)[0]
        const x = 1000 * prevItem.value / maxValue + (1000 * (nextItem.value - prevItem.value) / maxValue) * progress
        const value = Math.floor(prevItem.value + (prevItem.value - nextItem.value) * progress)
        const prevY = 21 + 48 * prevItem.rank
        const nextY = 21 + 48 * nextItem.rank
        const curY = prevY + (nextY - prevY) * slideProgress
        // const targetY = 21 + 48 * curFrame.rank
        return {
            transform: `translate(${x}, ${curY})`,
            company: prevItem.name,
            value: numberWithCommas(value),
        }
    })

    return <svg viewBox="0,0,1000,600">
        <g fillOpacity="0.6">
            {
                rectangles.map((rect, index) => (
                    <rect
                        key={index}
                        fill={rect.color}
                        height={44}
                        x={0}
                        y={rect.y}
                        width={rect.width.toString()}
                    />
                ))
            }
        </g>
        <g
            transform="translate(0,16)"
            fill="none"
            fontSize={10}
            textAnchor="middle"
        >
            {
                ticks.map((tick, index) => (
                    <g key={index} className="tick" opacity={1} transform={tick.transform}>
                        <line stroke={tick.lineStroke} y2="580.8"/>
                        {tick.text && (
                            <text fill="currentColor" y={tick.textY} dy="0em">
                                {tick.text}
                            </text>
                        )}
                    </g>
                ))
            }
        </g>
        <g
            textAnchor="end"
            style={{
                fontStyle: "",
                fontVariantLigatures: "",
                fontVariantNumeric: "tabular-nums",
                fontVariantEastAsian: "",
                fontVariantAlternates: "",
                fontFeatureSettings: "",
                fontVariationSettings: "",
                fontWeight: "",
                fontStretch: "",
                fontSize: "",
                lineHeight: "",
                fontFamily: "",
            }}
        >
            {
                textData.map((item, index) => (
                    <text key={index} transform={item.transform} y="21.5" x={-6} dy="-0.25em">
                        {item.company}
                        <tspan fillOpacity="0.7" fontWeight="normal" x={-6} dy="1.15em">
                            {item.value}
                        </tspan>
                    </text>
                ))
            }
        </g>
        <text
            textAnchor="end"
            x={920}
            y="570"
            dy="0.32em"
            style={{
                fontVariantNumeric: "tabular-nums",
                fontSize: 80,
            }}
        >
            {
                curKeyframe[0].getFullYear()
            }
        </text>
    </svg>
}

// group
// 'date', 'name', 'category', 'value'

function computeKeyframes(data) {
    const grp = {}
    data.forEach((item) => {
        const date = item.date
        if (!grp[date]) {
            grp[date] = []
        }
        grp[date].push(item)
    })
    const datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
        .map(([date, data]) => [new Date(date), data])
        .sort(([a], [b]) => d3.ascending(a, b))
    console.log("datevalues", datevalues)
    const names = new Set(data.map(d => d.name))
    const n = 12

    function rank(value) {
        const data = Array.from(names, name => ({name, value: value(name)}))
        data.sort((a, b) => d3.descending(a.value, b.value))
        for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i)
        return data
    }

    const ranked = rank(name => datevalues[0][1].get(name))
    console.log("ranked", ranked)
    const keyframes = []
    const k = 10
    let ka, a, kb, b
    for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
        for (let i = 0; i < k; ++i) {
            const t = i / k
            keyframes.push([
                new Date(ka * (1 - t) + kb * t),
                rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t),
            ])
        }
    }
    keyframes.push([new Date(kb), rank(name => b.get(name) || 0)])
    return keyframes
}


function computeColorByName(data: any) {
    const colorByName = new Map(data.map(d => [d.name, d.color]))
    const category = new Set(data.map(d => d.name))
    const color = d3.scaleOrdinal()
        .domain(category)
        .range(d3.schemeTableau10)
    data.forEach((item) => {
        item.color = color(item.name)
        colorByName.set(item.name, item.color)
    })
    return colorByName
}


export const BarRace: React.FC<{}> = ({}) => {
    const [colorByName, setColorByName] = useState(new Map())
    const [keyframes, setKeyframes] = useState([])
    const [handle] = useState(() => delayRender())

    useEffect(() => {
        const init = async () => {
            const res = await fetch(staticFile(`/category-brands.csv`))
            const text = await res.text()
            const data = d3.csvParse(text, d3.autoType)
            const colorByName = computeColorByName(data)
            setColorByName(colorByName)
            const keyframes = computeKeyframes(data)
            setKeyframes(keyframes)
            continueRender(handle)
        }
        init()
    }, [])

    return (
        <AbsoluteFill
            className="bg-white p-12"
        >
            {
                keyframes.length === 0 ? null : <BarChartKeyFrames
                    colorByName={colorByName}
                    keyframes={keyframes}/>
            }
        </AbsoluteFill>
    )
}
