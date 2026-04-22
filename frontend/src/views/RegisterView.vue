<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  username: '',
  password: '',
  realname: '',
  company_name: '',
  field: '',
  nature: '',
  scale: '',
  contact: ''
})

const proofFile = ref<File | null>(null)

const handleProofChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    proofFile.value = target.files[0]
  }
}

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 企业注册
    const formData = new FormData()
    formData.append('username', form.username)
    formData.append('password', form.password)
    formData.append('realname', form.realname)
    formData.append('company_name', form.company_name)
    formData.append('field', form.field)
    formData.append('nature', form.nature)
    formData.append('scale', form.scale)
    formData.append('contact', form.contact)
    
    if (proofFile.value) {
      formData.append('proof', proofFile.value)
    }
    
    const response = await fetch('http://localhost:5000/api/company-register', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '注册成功，请等待管理员审批，即将跳转到登录页面...'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-form">
      <!-- 企业注册标题区域 -->
      <div class="form-header">
        <div class="logo-container">
          <div class="logo">
            <div class="logo-icon">🏢</div>
          </div>
        </div>
        <h1 class="form-title">企业注册</h1>
        <p class="form-subtitle">请认真填写以下信息，我们将尽快审核您的申请</p>
      </div>

      <!-- 消息提示 -->
      <div v-if="errorMessage" class="message error-message">
        <div class="message-icon">⚠️</div>
        <div class="message-content">{{ errorMessage }}</div>
      </div>

      <div v-if="successMessage" class="message success-message">
        <div class="message-icon">✅</div>
        <div class="message-content">{{ successMessage }}</div>
      </div>

      <!-- 表单内容 -->
      <form @submit="handleSubmit" class="company-form">
        <!-- 账号信息 -->
        <div class="form-section">
          <h3 class="section-title">账号信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="username" class="form-label">
                <span class="required">*</span> 企业账号
              </label>
              <div class="input-wrapper">
                <span class="input-icon">🏢</span>
                <input
                  type="text"
                  id="username"
                  v-model="form.username"
                  required
                  placeholder="请输入企业账号"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">
                <span class="required">*</span> 密码
              </label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  v-model="form.password"
                  required
                  placeholder="请输入密码"
                  class="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 联系人信息 -->
        <div class="form-section">
          <h3 class="section-title">联系人信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="realname" class="form-label">
                <span class="required">*</span> 联系人姓名
              </label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  id="realname"
                  v-model="form.realname"
                  required
                  placeholder="请输入联系人姓名"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="contact" class="form-label">
                <span class="required">*</span> 联系方式
              </label>
              <div class="input-wrapper">
                <span class="input-icon">📞</span>
                <input
                  type="text"
                  id="contact"
                  v-model="form.contact"
                  required
                  placeholder="请输入联系方式（手机号或邮箱）"
                  class="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 企业信息 -->
        <div class="form-section">
          <h3 class="section-title">企业信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="company_name" class="form-label">
                <span class="required">*</span> 企业名称
              </label>
              <div class="input-wrapper">
                <span class="input-icon">🏭</span>
                <input
                  type="text"
                  id="company_name"
                  v-model="form.company_name"
                  required
                  placeholder="请输入企业名称"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="field" class="form-label">
                <span class="required">*</span> 领域
              </label>
              <div class="input-wrapper">
                <span class="input-icon">📊</span>
                <input
                  type="text"
                  id="field"
                  v-model="form.field"
                  required
                  placeholder="请输入企业所属领域（如：IT、金融、教育等）"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="nature" class="form-label">
                <span class="required">*</span> 企业性质
              </label>
              <div class="input-wrapper select-wrapper">
                <span class="input-icon">🏛️</span>
                <select
                  id="nature"
                  v-model="form.nature"
                  required
                  class="form-input form-select"
                >
                  <option value="">请选择企业性质</option>
                  <option value="国企">国企</option>
                  <option value="私企">私企</option>
                  <option value="外企">外企</option>
                  <option value="合资">合资</option>
                  <option value="事业单位">事业单位</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="scale" class="form-label">
                <span class="required">*</span> 企业规模
              </label>
              <div class="input-wrapper select-wrapper">
                <span class="input-icon">👥</span>
                <select
                  id="scale"
                  v-model="form.scale"
                  required
                  class="form-input form-select"
                >
                  <option value="">请选择企业规模</option>
                  <option value="小型">小型（50人以下）</option>
                  <option value="中型">中型（50-500人）</option>
                  <option value="大型">大型（500人以上）</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 证明材料 -->
        <div class="form-section">
          <h3 class="section-title">证明材料</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="proof" class="form-label">
                <span class="required">*</span> 证明材料
              </label>
              <div class="file-upload">
                <label class="file-label" for="proof">
                  <span class="file-icon">📄</span>
                  <span v-if="proofFile" class="file-name">{{ proofFile.name }}</span>
                  <span v-else class="file-placeholder">点击上传营业执照或其他证明材料</span>
                  <input
                    type="file"
                    id="proof"
                    @change="handleProofChange"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    class="file-input"
                  />
                </label>
                <p class="file-hint">支持PDF、JPG、PNG格式文件</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <button type="submit" class="register-btn" :disabled="loading" :class="{ loading: loading }">
            <span v-if="loading" class="loading-spinner"></span>
            <span>{{ loading ? '注册中...' : '提交注册' }}</span>
          </button>
        </div>
      </form>

      <!-- 登录链接 -->
      <div class="login-section">
        <p class="login-text">
          已有账号？
          <router-link to="/login" class="login-link">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.register-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.register-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
}

/* 表单头部 */
.form-header {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.logo-container {
  margin-bottom: 20px;
}

.logo {
  display: inline-block;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.form-subtitle {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.4;
}

/* 消息提示 */
.message {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  margin: 20px;
  border-radius: 8px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
}

.message-icon {
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  line-height: 1.4;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #166534;
}

/* 表单内容 */
.company-form {
  padding: 40px;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e3c72;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #2a5298;
  display: inline-block;
}

.form-row {
  margin-bottom: 20px;
}

.form-group {
  width: 100%;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.required {
  color: #ef4444;
  margin-right: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.input-wrapper:hover {
  border-color: #d1d5db;
}

.input-wrapper:focus-within {
  border-color: #2a5298;
  box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
  background: white;
}

.input-icon {
  padding: 0 15px;
  color: #6b7280;
  font-size: 16px;
  border-right: 1px solid #e5e7eb;
}

.form-input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #111827;
  outline: none;
}

.form-input::placeholder {
  color: #9ca3af;
}

/* 下拉框样式 */
.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 15px;
  color: #6b7280;
  pointer-events: none;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.select-wrapper:focus-within .select-arrow {
  transform: rotate(180deg);
}

/* 文件上传 */
.file-upload {
  margin-top: 8px;
}

.file-label {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.file-label:hover {
  border-color: #2a5298;
  background: #f3f4f6;
}

.file-icon {
  font-size: 24px;
  margin-right: 15px;
  color: #6b7280;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.file-placeholder {
  flex: 1;
  font-size: 14px;
  color: #9ca3af;
}

.file-input {
  display: none;
}

.file-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

/* 提交按钮 */
.form-actions {
  margin-top: 40px;
}

.register-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  letter-spacing: 0.5px;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(42, 82, 152, 0.3);
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 登录链接 */
.login-section {
  padding: 30px 40px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.login-text {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.login-link {
  color: #2a5298;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #1e3c72;
  text-decoration: underline;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-form {
    max-width: 100%;
    margin: 0 20px;
  }
  
  .form-header {
    padding: 30px 20px;
  }
  
  .company-form {
    padding: 30px 20px;
  }
  
  .form-title {
    font-size: 24px;
  }
  
  .form-actions {
    margin-top: 30px;
  }
  
  .login-section {
    padding: 20px;
  }
}
</style>
