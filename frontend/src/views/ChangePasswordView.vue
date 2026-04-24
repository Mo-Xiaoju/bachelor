<template>
  <div class="change-password-container">
    <div class="change-password-form">
      <h2>修改密码</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form @submit="handleSubmit">
        <div class="form-group">
          <label for="newPassword">新密码</label>
          <input
            type="password"
            id="newPassword"
            v-model="form.newPassword"
            required
            placeholder="请输入新密码（至少6位）"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="form.confirmPassword"
            required
            placeholder="请再次输入新密码"
            minlength="6"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '提交中...' : '确认修改' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')
  return token
}

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  if (form.newPassword.length < 6) {
    errorMessage.value = '密码至少需要6位'
    loading.value = false
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    loading.value = false
    return
  }

  try {
    const token = getToken()
    const response = await fetch(buildURL('/api/change-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
      body: JSON.stringify({
        newPassword: form.newPassword
      })
    })

    const result = await response.json()

    if (result.success) {
      successMessage.value = '密码修改成功，即将跳转到首页...'
      setTimeout(() => {
        router.push('/')
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

<style scoped>
.change-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
 
  padding: 20px;
  box-sizing: border-box;
}

.change-password-form {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 40px 50px;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05);
  width: 500px;
  max-width: 1000px;
  margin: 0 auto;
  border: 1px solid #e8ebff;
  position: relative;
  overflow: hidden;
}

.change-password-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8ebff;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover::before {
  left: 100%;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #fee2e2;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #bbf7d0;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);
}
</style>
