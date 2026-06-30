/**
 * 作品管理页面
 * 职责：显示作品列表，创建/删除作品
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.ts'
import { htmlExporter } from '../services/HTMLExporter.ts'
import { zipExporter } from '../services/ZipExporter.ts'
import { DEFAULT_STORY_META, DEFAULT_START_NODE } from '../constants/defaults.ts'
import notification from '../utils/notification.ts'
import Loading from '../components/ui/Loading.tsx'
import type { Story } from '../types/index.ts'
import { usePluginSystem } from '../contexts/PluginContext.tsx'
import '../styles/dashboard.css'

function Dashboard(): JSX.Element {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'))
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [publishConfirmId, setPublishConfirmId] = useState<string | null>(null)
  const [logoutConfirm, setLogoutConfirm] = useState<boolean>(false)
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState<boolean>(false)
  const [showEmailBindModal, setShowEmailBindModal] = useState<boolean>(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const navigate = useNavigate()
  const pluginSystem = usePluginSystem()

  // 加载播放器模板
  useEffect(() => {
    htmlExporter.loadTemplates().catch(error => {
      console.error('加载播放器模板失败:', error)
    })
  }, [])

  useEffect(() => {
    if (username) {
      loadStories()
      loadUserEmail()
    } else {
      setLoading(false)
    }
  }, [username])

  // 删除确认3秒倒计时
  useEffect(() => {
    if (deleteConfirmId) {
      const timer = setTimeout(() => {
        setDeleteConfirmId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return () => {} // 返回空清理函数
  }, [deleteConfirmId])

  // 发布确认3秒倒计时
  useEffect(() => {
    if (publishConfirmId) {
      const timer = setTimeout(() => {
        setPublishConfirmId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return () => {} // 返回空清理函数
  }, [publishConfirmId])

  // 退出确认3秒倒计时
  useEffect(() => {
    if (logoutConfirm) {
      const timer = setTimeout(() => {
        setLogoutConfirm(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [logoutConfirm])

  // 删除账户确认3秒倒计时
  useEffect(() => {
    if (deleteAccountConfirm) {
      const timer = setTimeout(() => {
        setDeleteAccountConfirm(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [deleteAccountConfirm])

  async function loadStories(): Promise<void> {
    if (!username) {
      setLoading(false)
      return
    }

    try {
      const data = await api.drafts.getAll()
      setStories(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserEmail(): Promise<void> {
    if (!username) return

    try {
      const result = await api.email.getMyEmail()
      setUserEmail(result.email)
    } catch (error) {
      console.error('加载邮箱信息失败:', error)
    }
  }

  async function handleUnbindEmail(): Promise<void> {
    if (!username || !userEmail) return

    const confirmed = confirm(`确定要解绑邮箱 ${userEmail} 吗？解绑后将无法使用邮箱登录。`)
    if (!confirmed) return

    try {
      await api.email.unbindEmail()
      notification.success('邮箱已解绑')
      setUserEmail(null)
    } catch (error) {
      console.error('解绑邮箱失败:', error)
      const err = error as Error
      notification.error(err.message || '解绑失败')
    }
  }

  /**
   * 登录成功回调
   */
  function handleLoginSuccess(name: string, token: string): void {
    localStorage.setItem('username', name)
    localStorage.setItem('token', token)
    setUsername(name)
    setLoading(true)
  }

  /**
   * 退出登录
   */
  function handleLogout(): void {
    if (logoutConfirm) {
      // 第二次点击：执行退出
      localStorage.removeItem('username')
      localStorage.removeItem('token')
      setUsername(null)
      setStories([])
      setLogoutConfirm(false)
    } else {
      // 第一次点击：显示确认状态
      setLogoutConfirm(true)
    }
  }

  /**
   * 删除账户
   */
  async function handleDeleteAccount(): Promise<void> {
    if (!username) return

    if (deleteAccountConfirm) {
      // 第二次点击：直接执行删除
      try {
        await api.account.deleteAccount()
        notification.success('账户已删除')
        localStorage.removeItem('username')
        localStorage.removeItem('token')
        setUsername(null)
        setStories([])
        setDeleteAccountConfirm(false)
      } catch (error) {
        console.error('删除账户失败:', error)
        const err = error as Error
        notification.error(err.message || '删除账户失败')
        setDeleteAccountConfirm(false)
      }
    } else {
      // 第一次点击：显示确认状态
      setDeleteAccountConfirm(true)
    }
  }

  async function handleCreateNew(): Promise<void> {
    try {
      const newStory: Story = {
        id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meta: DEFAULT_STORY_META,
        nodes: [DEFAULT_START_NODE],
        edges: [],
        variables: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await api.drafts.save(newStory)
      navigate(`/editor/${newStory.id}`)
    } catch (error) {
      console.error('创建失败:', error)
      const err = error as Error
      notification.error('创建失败：' + err.message)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()
    
    if (deleteConfirmId === id) {
      // 第二次点击：执行删除
      try {
        await api.drafts.delete(id)
        notification.success('作品已删除')
        setDeleteConfirmId(null)
        await loadStories()
      } catch (error) {
        console.error('删除失败:', error)
        notification.error('删除失败')
      }
    } else {
      // 第一次点击：按钮变红，3秒倒计时
      setDeleteConfirmId(id)
    }
  }

  async function handleExportJSON(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()

    try {
      const story = await api.drafts.getById(id)
      
      if (!story) {
        notification.error('故事不存在')
        return
      }
      
      const dataStr = JSON.stringify(story, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${story.meta.title}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      notification.success('故事已导出为JSON')
    } catch (error) {
      console.error('导出失败:', error)
      notification.error('导出失败')
    }
  }

  async function handleExportZip(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()

    try {
      const story = await api.drafts.getById(id)
      
      if (!story) {
        notification.error('故事不存在')
        return
      }
      
      await zipExporter.exportToZip(story)
      notification.success('故事已导出为ZIP')
    } catch (error) {
      console.error('导出失败:', error)
      notification.error(error instanceof Error ? error.message : '导出失败')
    }
  }

  async function handleExportHTML(id: string, mode: 'visual-novel', e: React.MouseEvent): Promise<void> {
    e.stopPropagation()

    try {
      const story = await api.drafts.getById(id)
      
      if (!story) {
        notification.error('故事不存在')
        return
      }
      
      notification.info(`正在导出视觉小说HTML，请稍候...`)
      
      // 获取当前激活的样式插件CSS
      let customStyleCSS = ''
      const compatibleWith = 'visual-novel'
      const allPlugins = pluginSystem.getAllPlugins()
      
      for (const registered of allPlugins) {
        const pluginInstance = registered.plugin
        // 查找激活的、兼容当前播放模式的样式插件
        if (
          registered.enabled && 
          pluginInstance.metadata.compatibleWith?.includes(compatibleWith) &&
          (pluginInstance.metadata.id.startsWith('player-style.') || pluginInstance.metadata.id.startsWith('vn-style.'))
        ) {
          // 获取插件的CSS（如果有getCSS方法）
          if (typeof (pluginInstance as any).getCSS === 'function') {
            customStyleCSS = (pluginInstance as any).getCSS()
            break
          }
        }
      }
      
      await htmlExporter.exportToHTML(story, mode, customStyleCSS)
      
      notification.success(`${mode}HTML已导出`)
    } catch (error) {
      console.error('导出HTML失败:', error)
      notification.error(error instanceof Error ? error.message : '导出HTML失败')
    }
  }


  async function handleImportJSON(): Promise<void> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const story = JSON.parse(text)
        
        // 创建新故事（重新生成ID和时间）
        const newStory: Story = {
          ...story,
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await api.drafts.save(newStory)
        notification.success('JSON已导入')
        await loadStories()
      } catch (error) {
        console.error('导入失败:', error)
        notification.error('导入失败：文件格式错误')
      }
    }
    
    input.click()
  }

  async function handleImportZip(): Promise<void> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip,application/zip'
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      
      try {
        notification.info('正在解析ZIP文件...')
        
        const story = await zipExporter.importFromZip(file)
        
        // 创建新故事（重新生成ID和时间）
        const newStory: Story = {
          ...story,
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await api.drafts.save(newStory)
        notification.success('ZIP已导入')
        await loadStories()
      } catch (error) {
        console.error('导入失败:', error)
        notification.error(error instanceof Error ? error.message : '导入失败')
      }
    }
    
    input.click()
  }

  async function handlePublish(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()
    
    if (!username) return

    if (publishConfirmId === id) {
      // 第二次点击：执行发布
      try {
        const story = stories.find(s => s.id === id)
        if (!story) return

        const result = await api.publish.publish(id)
        
        if (result.success && result.shareUrl) {
          const shareUrl = window.location.origin + result.shareUrl
          notification.showShareLink(story.meta.title, story.meta.author, shareUrl)
        }
        
        setPublishConfirmId(null)
      } catch (error) {
        console.error('发布失败:', error)
        const err = error as Error
        notification.error(err.message || '发布失败')
      }
    } else {
      // 第一次点击：按钮变色，3秒倒计时
      setPublishConfirmId(id)
    }
  }

  if (loading) {
    return <Loading />
  }

  // 未登录：显示登录卡片
  if (!username) {
    return <LoginCard onSuccess={handleLoginSuccess} />
  }

  // 已登录：显示作品列表
  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <h1>互动小说编辑器</h1>
        {username && (
          <div className="dashboard-user">
            <span className="user-name">用户: {username}</span>
            {userEmail && <span className="user-email">邮箱: {userEmail}</span>}
            <button onClick={() => setShowEmailBindModal(true)}>
              {userEmail ? '更换邮箱' : '绑定邮箱'}
            </button>
            {userEmail && (
              <button onClick={handleUnbindEmail}>解绑邮箱</button>
            )}
            <button 
              onClick={handleLogout}
              style={{ 
                color: logoutConfirm ? '#f59e0b' : undefined,
                fontWeight: logoutConfirm ? 'bold' : undefined
              }}
            >
              {logoutConfirm ? '确认退出？' : '退出'}
            </button>
            <button 
              onClick={handleDeleteAccount}
              style={{ 
                color: deleteAccountConfirm ? '#dc2626' : undefined,
                fontWeight: deleteAccountConfirm ? 'bold' : undefined
              }}
            >
              {deleteAccountConfirm ? '确认删除？' : '删除账户'}
            </button>
          </div>
        )}
      </header>

      {/* 邮箱绑定模态框 */}
      {showEmailBindModal && (
        <EmailBindModal
          onClose={() => setShowEmailBindModal(false)}
          onSuccess={() => {
            setShowEmailBindModal(false)
            loadUserEmail()
          }}
        />
      )}

      {/* 样式选择模态框 */}

      <div className="dashboard-actions">
        <button className="btn-primary" onClick={handleCreateNew}>
          + 创建新作品
        </button>
        <button className="btn-secondary" onClick={handleImportJSON}>
          导入JSON
        </button>
        <button className="btn-secondary" onClick={handleImportZip}>
          导入ZIP
        </button>
        <button className="btn-secondary" onClick={() => navigate('/plugins')}>
          插件商店
        </button>
      </div>

      <div className="stories-grid">
        {stories.length === 0 ? (
          <div className="empty-state">
          </div>
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              className="story-card"
              onClick={() => navigate(`/editor/${story.id}`)}
            >
              <h3>{story.meta.title}</h3>
              <p className="story-meta">
                作者: {story.meta.author || '未命名'}
              </p>
              <p className="story-desc">
                {story.meta.description || '暂无描述'}
              </p>
              <div className="story-stats">
                <span>{story.nodes?.length || 0} 个节点</span>
                <span>{story.edges?.length || 0} 条连线</span>
              </div>
              <div className="story-actions">
                {username && (
                  <button
                    className={`btn-icon ${publishConfirmId === story.id ? 'btn-confirm' : ''}`}
                    onClick={(e) => handlePublish(story.id, e)}
                    title={publishConfirmId === story.id ? '确认发布？(3秒后取消)' : '发布到平台'}
                  >
                    {publishConfirmId === story.id ? '确认发布？' : '发布'}
                  </button>
                )}
                <button
                  className="btn-icon"
                  onClick={(e) => handleExportJSON(story.id, e)}
                  title="导出JSON（纯文本）"
                >
                  JSON
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => handleExportZip(story.id, e)}
                  title="导出ZIP（含图片）"
                >
                  ZIP
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => handleExportHTML(story.id, 'visual-novel', e)}
                  title="导出为HTML"
                >
                  HTML
                </button>
                <button
                  className={`btn-icon btn-danger ${deleteConfirmId === story.id ? 'btn-danger-confirm' : ''}`}
                  onClick={(e) => handleDelete(story.id, e)}
                  title={deleteConfirmId === story.id ? '确认删除？(3秒后取消)' : '删除'}
                >
                  {deleteConfirmId === story.id ? '确认删除？' : '删除'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * 登录卡片组件
 * 职责：处理用户登录/注册
 */
interface LoginCardProps {
  onSuccess: (username: string, token: string) => void
}

function LoginCard({ onSuccess }: LoginCardProps): JSX.Element {
  const [loginMethod, setLoginMethod] = useState<'password' | 'email'>('password')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [emailStep, setEmailStep] = useState<'input-email' | 'input-code'>('input-email')
  const [loading, setLoading] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [countdown])

  async function handlePasswordLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    
    if (!username.trim()) {
      notification.error('请输入用户名')
      return
    }
    
    if (!password.trim()) {
      notification.error('请输入密码')
      return
    }

    setLoading(true)
    
    try {
      const result = await api.login.auth(username.trim(), password)
      
      if (result.success && result.token) {
        notification.success('登录成功')
        onSuccess(result.username, result.token)
      } else {
        notification.error(result.error || '登录失败')
      }
    } catch (error) {
      const err = error as Error
      notification.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendEmailCode(): Promise<void> {
    if (!email.trim()) {
      notification.error('请输入邮箱地址')
      return
    }

    setLoading(true)
    try {
      await api.email.sendLoginCode(email.trim())
      notification.success('验证码已发送，请查收邮件')
      setEmailStep('input-code')
      setCountdown(60)
    } catch (error) {
      const err = error as Error
      notification.error(err.message || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()

    if (!code.trim()) {
      notification.error('请输入验证码')
      return
    }

    setLoading(true)
    try {
      const result = await api.email.verifyLoginCode(email.trim(), code.trim())
      
      if (result.success && result.token) {
        notification.success('登录成功')
        onSuccess(result.username, result.token)
      }
    } catch (error) {
      const err = error as Error
      notification.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>互动小说编辑器</h1>
      </header>

      <div className="login-container">
        <div className="login-card">
          {/* 登录方式切换 */}
          <div className="login-tabs">
            <button
              className={`login-tab ${loginMethod === 'password' ? 'active' : ''}`}
              onClick={() => setLoginMethod('password')}
              type="button"
            >
              用户名登录
            </button>
            <button
              className={`login-tab ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMethod('email')}
              type="button"
            >
              邮箱登录
            </button>
          </div>

          {/* 用户名密码登录 */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username">用户名</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">密码</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn-primary btn-login" disabled={loading}>
                {loading ? '登录中...' : '登录 / 注册'}
              </button>
              
              <p className="login-note">首次使用将自动创建账户</p>
            </form>
          )}

          {/* 邮箱验证码登录 */}
          {loginMethod === 'email' && (
            <div className="login-form">
              {emailStep === 'input-email' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="login-email">邮箱地址</label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入已绑定的邮箱"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <a
                    className="email-link"
                    onClick={handleSendEmailCode}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? '发送中...' : '发送验证码'}
                  </a>
                  <p className="login-note">使用已绑定账户的邮箱登录</p>
                </>
              ) : (
                <form onSubmit={handleEmailLogin}>
                  <p className="login-hint">
                    验证码已发送至 <strong>{email}</strong>
                  </p>
                  <div className="form-group">
                    <label htmlFor="login-code">验证码</label>
                    <input
                      id="login-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <div className="login-email-actions">
                    <a
                      className="email-link"
                      onClick={() => setEmailStep('input-email')}
                      style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                    >
                      重新输入邮箱
                    </a>
                    <a
                      className="email-link"
                      onClick={handleSendEmailCode}
                      style={{ cursor: (loading || countdown > 0) ? 'not-allowed' : 'pointer', opacity: (loading || countdown > 0) ? 0.5 : 1 }}
                    >
                      {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                    </a>
                  </div>
                  <button type="submit" className="btn-primary btn-login" disabled={loading}>
                    {loading ? '登录中...' : '登录'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 邮箱绑定模态框
 * 职责：处理邮箱绑定流程（发送验证码、输入验证码）
 */
interface EmailBindModalProps {
  onClose: () => void
  onSuccess: () => void
}

function EmailBindModal({ onClose, onSuccess }: EmailBindModalProps): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [step, setStep] = useState<'input-email' | 'input-code'>('input-email')
  const [loading, setLoading] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [countdown])

  async function handleSendCode(): Promise<void> {
    if (!email.trim()) {
      notification.error('请输入邮箱地址')
      return
    }

    setLoading(true)
    try {
      await api.email.sendVerificationCode(email.trim())
      notification.success('验证码已发送，请查收邮件')
      setStep('input-code')
      setCountdown(60) // 60秒倒计时
    } catch (error) {
      const err = error as Error
      notification.error(err.message || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleBindEmail(): Promise<void> {
    if (!code.trim()) {
      notification.error('请输入验证码')
      return
    }

    setLoading(true)
    try {
      await api.email.bindEmail(email.trim(), code.trim())
      notification.success('邮箱绑定成功')
      onSuccess()
    } catch (error) {
      const err = error as Error
      notification.error(err.message || '绑定失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>绑定邮箱</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 'input-email' ? (
            <>
              <p className="modal-description">
                绑定邮箱后，您可以使用邮箱+验证码的方式登录
              </p>
              <div className="form-group">
                <label htmlFor="email">邮箱地址</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <a
                className="email-link"
                onClick={handleSendCode}
                style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? '发送中...' : '发送验证码'}
              </a>
            </>
          ) : (
            <>
              <p className="modal-description">
                验证码已发送至 <strong>{email}</strong>
              </p>
              <p className="modal-hint">验证码30分钟内有效，请注意查收邮件</p>
              <div className="form-group">
                <label htmlFor="code">验证码</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <a
                  className="email-link"
                  onClick={() => setStep('input-email')}
                  style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                  重新输入邮箱
                </a>
                <a
                  className="email-link"
                  onClick={handleSendCode}
                  style={{ cursor: (loading || countdown > 0) ? 'not-allowed' : 'pointer', opacity: (loading || countdown > 0) ? 0.5 : 1 }}
                >
                  {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                </a>
                <a
                  className="email-link"
                  onClick={handleBindEmail}
                  style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? '绑定中...' : '确认绑定'}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
