<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  studentId: '',
  idCardLast6: ''
})

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(buildURL('/api/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    })

    const result = await response.json()

    if (result.success) {
      console.log('登录成功，返回数据:', result)
      console.log('Token:', result.token)
      console.log('User:', result.user)

      // 存储 Token 和用户信息到 sessionStorage（每个标签页独立）
      sessionStorage.setItem('token', result.token)
      sessionStorage.setItem('user', JSON.stringify(result.user))

      // 验证存储是否成功


      if (result.requireChangePassword) {
        router.push('/change-password')
      } else {
        // 根据用户角色跳转到不同页面
        if (result.user.role === 'company') {
          router.push('/company')
        } else {
          router.push('/')
        }
      }
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
  <div class="login-container">
    <div class="login-form">
      <h2>系统登录</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit="handleSubmit">
        <div class="form-group">
          <label for="studentId">学号/工号</label>
          <input
            type="text"
            id="studentId"
            v-model="form.studentId"
            required
            placeholder="请输入学号或工号"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label for="idCardLast6">身份证后六位(首次登陆)  密码</label>
          <input
            type="password"
            id="idCardLast6"
            v-model="form.idCardLast6"
            required
            placeholder="请输入身份证后六位或密码"

          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="login-tip">
        <p>首次登录后需要修改密码</p>
      </div>

      <div class="register">
        <span class="register-text">校外人员？</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;

  padding: 20px;
  box-sizing: border-box;
}

.login-form {
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

.login-form::before {
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
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
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

input::placeholder {
  color: #999;
  font-size: 14px;
}

.login-btn {
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

.login-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover::before {
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

.login-tip {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #6b7280;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.login-tip:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.register {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 10px;
  border: 2px dashed #c7d2fe;
  transition: all 0.3s ease;
}

.register:hover {
  background: linear-gradient(135deg, #e8ebff 0%, #d4d9ff 100%);
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
}

.register-text {
  font-size: 14px;
  color: #4b5563;
  margin-right: 10px;
  font-weight: 500;
}

.register-link {
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 20px;
  background: white;
  border-radius: 25px;
  border: 2px solid #667eea;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.register-link:hover {
  background: #667eea;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.register-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.register-link:hover::before {
  left: 100%;
}
</style>
