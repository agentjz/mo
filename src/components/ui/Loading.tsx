/**
 * 加载状态组件
 * 职责：显示加载动画
 */

// import React from 'react'
import './Loading.css'

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

function Loading({ message = '加载中...', fullScreen = false }: LoadingProps): JSX.Element {
  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  )
}

export default Loading

