import React from "react";
import bgStyle from "./Background.module.css"

/**
 * 背景装饰文字组件
 * 
 * 在页面背景显示巨大的装饰性标签文字，如 <PAGE> ... </PAGE>
 */
const Background = ({ text }: { text: string | "PAGE" }) => {
    return (
        <div className={bgStyle.background_text_wrapper}>
            <p className={`${bgStyle.background_text} ${bgStyle.background_bg_top}`}>{`<${text.toUpperCase()}>`}</p>
            <p className={`${bgStyle.background_text} ${bgStyle.background_bg_bottom}`}>{`</${text.toUpperCase()}>`}</p>
        </div>
    )
}

export default Background
