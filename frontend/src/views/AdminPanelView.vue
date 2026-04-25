<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildURL } from '../utils/api'
import { RouterLink } from 'vue-router'

const router = useRouter()
const currentStep = ref(0)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const user = ref<any>(null)
const selectedStartTime = ref('')
const selectedEndTime = ref('')
const activeTab = ref('double-selection') // 双选管理/校内用户注册/科研训练管理
const pendingProjects = ref<any[]>([])
const loadingProjects = ref(false)
const showProjectDetail = ref(false)
const selectedProject = ref<any>(null)
// 企业审批相关
const pendingCompanies = ref<any[]>([])
const loadingCompanies = ref(false)
const reviewComment = ref('')
const getToken = (): string | null => {
  const token = sessionStorage.getItem('token')
  console.log('Navbar - 获取 Token:', token ? '存在' : '不存在')
  return token
}
// 获取当前登录用户信息
const getUserInfo = async () => {
  const token = getToken()
  try {
    const response = await fetch(buildURL('/api/check-auth'), {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()
    if (result.success) {
      user.value = result.user
      if (user.value.role !== 'admin') {
        router.push('/')
      }
    } else {
      router.push('/login')
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    router.push('/login')
  }
}

// 获取当前双选阶段
const getCurrentStep = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/step'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      currentStep.value = result.step
    }
  } catch (error) {
    console.error('获取双选阶段失败', error)
    errorMessage.value = '获取双选阶段失败'
  }
}

// 设置双选阶段
const setStep = async (step: number) => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // 如果设置为阶段3（双选完成），先处理双选结果
    if (step === 3) {
      const processResult = await processSelectionResults()
      if (!processResult) {
        return
      }
    }

    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/step'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ step, startTime: null, endTime: null }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    // 检查响应是否成功
    if (!response.ok) {
      const text = await response.text()
      console.error('Error response:', text)
      errorMessage.value = `服务器错误: ${response.status}`
      return
    }

    const result = await response.json()
    console.log('API result:', result)

    if (result.success) {
      currentStep.value = step
      successMessage.value = '双选阶段设置成功'
      // 3秒后清除成功消息
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('设置双选阶段失败', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 处理双选结果
const processSelectionResults = async (): Promise<boolean> => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/process-selection-results'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('处理双选结果失败:', text)
      errorMessage.value = '处理双选结果失败'
      return false
    }

    const result = await response.json()
    if (result.success) {
      successMessage.value = '双选结果处理成功'
      // 3秒后清除成功消息
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
      return true
    } else {
      errorMessage.value = result.message
      return false
    }
  } catch (error) {
    console.error('处理双选结果失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    return false
  }
}

// 获取双选阶段时间
const getDoubleSelectionTime = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/time'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 获取当前阶段的时间设置
      const currentTimes = result.times[currentStep.value] || {}
      if (currentTimes.startTime) {
        selectedStartTime.value = currentTimes.startTime.replace(' ', 'T')
      }
      if (currentTimes.endTime) {
        selectedEndTime.value = currentTimes.endTime.replace(' ', 'T')
      }
    }
  } catch (error) {
    console.error('获取双选阶段时间失败', error)
  }
}

// 保存时间设置
const saveTimeSettings = async () => {
  if (!selectedStartTime.value && !selectedEndTime.value) {
    errorMessage.value = '请至少设置一个时间'
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/step'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({
        step: currentStep.value,
        startTime: selectedStartTime.value ? new Date(selectedStartTime.value).toISOString() : null,
        endTime: selectedEndTime.value ? new Date(selectedEndTime.value).toISOString() : null,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('保存时间设置失败:', text)
      errorMessage.value = '保存时间设置失败'
      return
    }

    const result = await response.json()
    if (result.success) {
      successMessage.value = '时间设置保存成功'
      // 3秒后清除成功消息
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('保存时间设置失败', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 重置双选数据
const resetDoubleSelection = async () => {
  if (!confirm('确定要重置所有双选数据吗？此操作不可恢复！')) {
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/reset-double-selection'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('重置双选数据失败:', text)
      errorMessage.value = '重置双选数据失败'
      return
    }

    const result = await response.json()
    if (result.success) {
      successMessage.value = '双选数据重置成功'
      // 3秒后清除成功消息
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
      // 刷新当前阶段
      await getCurrentStep()
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('重置双选数据失败', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab: string) => {
  activeTab.value = tab
  if (tab === 'research-training') {
    fetchPendingProjects()
  }
  if (tab === 'announcement') {
    fetchAnnouncements()
  }
  if (tab === 'company-review') {
    fetchPendingCompanies()
  }
}

// 获取待审批企业
const fetchPendingCompanies = async () => {
  loadingCompanies.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/companies/pending'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      pendingCompanies.value = result.companies
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('获取待审批企业失败', error)
    errorMessage.value = '网络错误'
  } finally {
    loadingCompanies.value = false
  }
}

// 下载证明材料
const downloadProof = async (filename: string) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/companies/proof/${filename}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载证明材料失败', error)
    errorMessage.value = '下载证明材料失败，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 审批企业
const reviewCompany = async (companyId: number, action: string) => {
  if (action === 'reject' && !reviewComment.value.trim()) {
    errorMessage.value = '拒绝时请填写审核意见'
    return
  }

  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/companies/approve'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({
        company_id: companyId,
        action: action,
        comment: reviewComment.value
      })
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = result.message
      reviewComment.value = ''
      fetchPendingCompanies()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('审批失败', error)
    errorMessage.value = '网络错误'
  } finally {
    loading.value = false
  }
}

// 校内用户注册
const showUserRegistration = ref(false)
const newUser = ref({
  username: '',
  realname: '',
  role: 'student',
  id_card: '',
  major: '',
  department: '',
  contact: '',
  title: '',
})

// 注册校内用户
const registerInnerUser = async () => {
  if (!newUser.value.username || !newUser.value.realname || !newUser.value.id_card) {
    errorMessage.value = '请填写必要字段（用户名、真实姓名和身份证号）'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    // 直接使用用户数据，后端会使用身份证后六位作为默认密码
    const userData = {
      ...newUser.value,
    }

    const response = await fetch(buildURL('/api/innerregister'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = '校内用户注册成功'
      // 重置表单
      newUser.value = {
        username: '',
        realname: '',
        role: 'student',
        id_card: '',
        major: '',
        department: '',
        contact: '',
        title: '',
      }
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('注册校内用户失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 批量注册相关
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
  }
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 下载模板文件
const downloadTemplate = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/download-template'), {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '批量注册模板.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else {
      errorMessage.value = '下载模板失败'
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('下载模板失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 批量注册
const batchRegister = async () => {
  if (!selectedFile.value) {
    errorMessage.value = '请选择Excel文件'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await fetch(buildURL('/api/batch-register'), {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: formData,
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = `批量注册成功，共注册 ${result.registered_count} 个用户`
      // 移除已选择的文件
      removeFile()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('批量注册失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 公告管理相关
const announcements = ref<any[]>([])
const loadingAnnouncements = ref(false)
const newAnnouncement = ref({
  title: '',
  content: '',
  attachments: [] as File[],
})
const showAddAnnouncement = ref(false)
const editingAnnouncement = ref<any>(null)
const showEditAnnouncement = ref(false)

// 获取公告列表
const fetchAnnouncements = async () => {
  loadingAnnouncements.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/announcements'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      announcements.value = result.announcements
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('获取公告列表失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loadingAnnouncements.value = false
  }
}

// 发布公告
const publishAnnouncement = async () => {
  if (!newAnnouncement.value.title || !newAnnouncement.value.content) {
    errorMessage.value = '请填写公告标题和内容'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('title', newAnnouncement.value.title)
    formData.append('content', newAnnouncement.value.content)

    // 添加附件
    newAnnouncement.value.attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file)
    })

    const response = await fetch(buildURL('/api/announcements'), {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: formData,
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = '公告发布成功'
      // 重新获取公告列表
      await fetchAnnouncements()
      // 重置表单
      newAnnouncement.value = {
        title: '',
        content: '',
        attachments: [],
      }
      showAddAnnouncement.value = false
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('发布公告失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 编辑公告
const editAnnouncement = async (announcement: any) => {
  editingAnnouncement.value = { ...announcement }
  // 保存原始附件ID列表，用于后续比较删除的附件
  editingAnnouncement.value.originalAttachmentIds = (announcement.attachments || []).map(
    (att: any) => att.id,
  )
  showEditAnnouncement.value = true
}

// 保存编辑
const saveEditAnnouncement = async () => {
  if (!editingAnnouncement.value.title || !editingAnnouncement.value.content) {
    errorMessage.value = '请填写公告标题和内容'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = sessionStorage.getItem('token')
    const formData = new FormData()
    formData.append('title', editingAnnouncement.value.title)
    formData.append('content', editingAnnouncement.value.content)

    // 计算需要删除的附件ID
    if (editingAnnouncement.value.originalAttachmentIds) {
      const currentAttachmentIds = (editingAnnouncement.value.attachments || [])
        .filter((att: any) => typeof att.id === 'number')
        .map((att: any) => att.id)

      const deletedAttachmentIds = editingAnnouncement.value.originalAttachmentIds.filter(
        (id: number) => !currentAttachmentIds.includes(id),
      )

      if (deletedAttachmentIds.length > 0) {
        deletedAttachmentIds.forEach((id: number, index: number) => {
          formData.append(`delete_attachments[${index}]`, id.toString())
        })
      }
    }

    // 添加附件
    if (editingAnnouncement.value.attachments && editingAnnouncement.value.attachments.length > 0) {
      editingAnnouncement.value.attachments.forEach((file: any) => {
        if (file instanceof File) {
          formData.append('attachments', file)
        }
      })
    }

    const response = await fetch(
      buildURL(`/api/announcements/${editingAnnouncement.value.id}`),
      {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: formData,
      },
    )

    const result = await response.json()
    if (result.success) {
      successMessage.value = '公告编辑成功'
      // 重新获取公告列表
      await fetchAnnouncements()
      // 重置表单
      editingAnnouncement.value = null
      showEditAnnouncement.value = false
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('编辑公告失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  editingAnnouncement.value = null
  showEditAnnouncement.value = false
}

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    if (showEditAnnouncement.value && editingAnnouncement.value) {
      // 如果是编辑模式，将新选择的文件添加到现有附件中
      const newFiles = Array.from(input.files)
      if (editingAnnouncement.value.attachments) {
        // 过滤掉非File对象（现有附件记录）
        const existingAttachments = editingAnnouncement.value.attachments.filter(
          (item: any) => typeof item.id === 'number',
        )
        // 创建新的attachments数组，确保触发UI更新
        editingAnnouncement.value = {
          ...editingAnnouncement.value,
          attachments: [...existingAttachments, ...newFiles],
        }
      } else {
        // 创建新的attachments数组，确保触发UI更新
        editingAnnouncement.value = {
          ...editingAnnouncement.value,
          attachments: newFiles,
        }
      }
    } else {
      newAnnouncement.value.attachments = Array.from(input.files)
    }
  }
}

// 移除附件
const removeAttachment = (index: number, isEditMode: boolean) => {
  if (isEditMode && editingAnnouncement.value && editingAnnouncement.value.attachments) {
    editingAnnouncement.value.attachments.splice(index, 1)
  } else {
    newAnnouncement.value.attachments.splice(index, 1)
  }
}

// 下载附件
const downloadAttachment = async (attachmentId: number, filename: string) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/attachments/${attachmentId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载附件失败', error)
    errorMessage.value = '下载附件失败，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 删除公告
const deleteAnnouncement = async (announcementId: number) => {
  if (!confirm('确定要删除这个公告吗？')) {
    return
  }

  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/announcements/${announcementId}`), {
      method: 'DELETE',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })

    const result = await response.json()
    if (result.success) {
      successMessage.value = '公告删除成功'
      // 重新获取公告列表
      await fetchAnnouncements()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('删除公告失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 获取待审核项目
const fetchPendingProjects = async () => {
  loadingProjects.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/research-projects/pending'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      pendingProjects.value = result.projects
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('获取待审核项目失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loadingProjects.value = false
  }
}

// 批准科研训练项目
const approveProject = async (projectId: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/research-projects/approve'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = '项目批准成功'
      // 重新获取待审核项目列表
      await fetchPendingProjects()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('批准项目失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 拒绝科研训练项目
const rejectProject = async (projectId: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/research-projects/reject'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = '项目拒绝成功'
      // 重新获取待审核项目列表
      await fetchPendingProjects()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('拒绝项目失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 查看课题详情
const viewProject = async (projectId: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/research-projects/${projectId}`), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      selectedProject.value = result.project
      showProjectDetail.value = true
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('获取课题详情失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 关闭课题详情弹窗
const closeProjectDetail = () => {
  showProjectDetail.value = false
  selectedProject.value = null
}

// 阶段选项
const stepOptions = [
  { value: 0, label: '未开始', description: '双选准备阶段' },
  { value: 1, label: '学生选导师', description: '学生可以选择导师' },
  { value: 2, label: '导师确认', description: '导师确认学生选择' },
  { value: 3, label: '双选完成', description: '双选流程结束' },
]

// 导师管理相关
const doubleSelectionTeachers = ref<any[]>([])
const loadingTeachers = ref(false)
const showAddTeacherDialog = ref(false)
const searchKeyword = ref('')
const selectedTeacher = ref<any>(null)
const minQuota = ref(0)
const maxQuota = ref(5)

// 获取参与双选的导师列表
const fetchDoubleSelectionTeachers = async () => {
  loadingTeachers.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/teachers/list'), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      doubleSelectionTeachers.value = result.teachers
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('获取导师列表失败', error)
    errorMessage.value = '网络错误'
  } finally {
    loadingTeachers.value = false
  }
}

// 搜索教师
const searchTeachers = ref<any[]>([])
const loadingSearch = ref(false)

const searchTeachersList = async () => {
  if (!searchKeyword.value.trim()) {
    searchTeachers.value = []
    return
  }

  loadingSearch.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL(`/api/users?role=teacher&keyword=${encodeURIComponent(searchKeyword.value)}`), {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 过滤掉已经参与双选的教师
      const existingTeacherIds = doubleSelectionTeachers.value.map(t => t.id)
      searchTeachers.value = result.users.filter((user: any) => !existingTeacherIds.includes(user.id))
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('搜索教师失败', error)
    errorMessage.value = '网络错误'
  } finally {
    loadingSearch.value = false
  }
}

// 选择教师
const selectTeacher = (teacher: any) => {
  selectedTeacher.value = teacher
  searchTeachers.value = []
  searchKeyword.value = ''
}

// 添加导师参与双选
const addTeacherToDoubleSelection = async () => {
  if (!selectedTeacher.value) {
    errorMessage.value = '请选择教师'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/teachers/add'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({
        teacher_id: selectedTeacher.value.id,
        min_quota: minQuota.value,
        max_quota: maxQuota.value
      })
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = '导师添加成功'
      await fetchDoubleSelectionTeachers()
      // 重置表单
      selectedTeacher.value = null
      minQuota.value = 0
      maxQuota.value = 5
      showAddTeacherDialog.value = false
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('添加导师失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 修改导师名额
const updateTeacherQuota = async (teacherId: number, minQuota: number, maxQuota: number) => {
  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/teachers/update'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({
        teacher_id: teacherId,
        min_quota: minQuota,
        max_quota: maxQuota
      })
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = '名额修改成功'
      await fetchDoubleSelectionTeachers()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('修改名额失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// 移除导师
const removeTeacherFromDoubleSelection = async (teacherId: number) => {
  if (!confirm('确定要移除这位导师吗？')) {
    return
  }

  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(buildURL('/api/double-selection/teachers/remove'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ teacher_id: teacherId })
    })
    const result = await response.json()
    if (result.success) {
      successMessage.value = '导师移除成功'
      await fetchDoubleSelectionTeachers()
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('移除导师失败', error)
    errorMessage.value = '网络错误，请稍后重试'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('管理员面板加载')
  await getUserInfo()
  await getCurrentStep()
  await getDoubleSelectionTime()
  // 如果当前标签是科研训练管理，获取待审核项目
  if (activeTab.value === 'research-training') {
    await fetchPendingProjects()
  }
  // 如果当前标签是公告管理，获取公告列表
  if (activeTab.value === 'announcement') {
    await fetchAnnouncements()
  }
  // 如果当前标签是双选管理，获取导师列表
  if (activeTab.value === 'double-selection') {
    await fetchDoubleSelectionTeachers()
  }
})
</script>

<template>
  <div class="admin-panel">
    <h1>管理员面板</h1>

    <!-- 消息提示 -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 1-2排版 -->
    <div class="layout-container">
      <!-- 左侧标签栏 -->
      <div class="left-sidebar">
        <div class="sidebar-title">管理功能</div>
        <div class="sidebar-menu">
          <div
            class="menu-item"
            :class="{ active: activeTab === 'double-selection' }"
            @click="switchTab('double-selection')"
          >
            <span class="menu-icon">📋</span>
            <span class="menu-text">双选管理</span>
          </div>
          <div
            class="menu-item"
            :class="{ active: activeTab === 'user-registration' }"
            @click="switchTab('user-registration')"
          >
            <span class="menu-icon">👥</span>
            <span class="menu-text">校内用户注册</span>
          </div>
          <div
            class="menu-item"
            :class="{ active: activeTab === 'research-training' }"
            @click="switchTab('research-training')"
          >
            <span class="menu-icon">🔬</span>
            <span class="menu-text">科研训练管理</span>
          </div>
          <div
            class="menu-item"
            :class="{ active: activeTab === 'announcement' }"
            @click="switchTab('announcement')"
          >
            <span class="menu-icon">📢</span>
            <span class="menu-text">公告管理</span>
          </div>
          <div
            class="menu-item"
            :class="{ active: activeTab === 'company-review' }"
            @click="switchTab('company-review')"
          >
            <span class="menu-icon">🏢</span>
            <span class="menu-text">企业审批</span>
          </div>
        </div>
      </div>

      <!-- 右侧功能栏 -->
      <div class="right-content">
        <!-- 双选管理 -->
        <div v-if="activeTab === 'double-selection'" class="tab-content">
          <div class="admin-section">
            <h2>双选管理</h2>
            <!-- 阶段管理和时间设置 -->
            <div class="double-selection-content">
              <!-- 左侧：当前阶段和阶段设置 -->
              <div class="double-selection-left">
                <div class="current-step">
                  <h3>当前阶段</h3>
                  <div class="step-info">
                    <span class="step-number">{{ currentStep }}</span>
                    <div class="step-details">
                      <span class="step-label">{{ stepOptions[currentStep].label }}</span>
                      <span class="step-description">{{
                        stepOptions[currentStep].description
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="step-selector">
                  <h3>设置阶段</h3>
                  <div class="step-buttons">
                    <button
                      v-for="option in stepOptions"
                      :key="option.value"
                      class="step-button"
                      :class="{ active: currentStep === option.value, loading }"
                      @click="setStep(option.value)"
                      :disabled="loading || currentStep === option.value"
                    >
                      <span class="step-button-number">{{ option.value }}</span>
                      <span class="step-button-label">{{ option.label }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 右侧：时间设置和数据管理 -->
              <div class="double-selection-right">
                <div class="time-settings">
                  <h3>阶段时间设置</h3>
                  <div class="time-inputs">
                    <div class="time-input-group">
                      <label>开始时间：</label>
                      <input
                        type="datetime-local"
                        v-model="selectedStartTime"
                        :disabled="loading"
                      />
                    </div>
                    <div class="time-input-group">
                      <label>结束时间：</label>
                      <input type="datetime-local" v-model="selectedEndTime" :disabled="loading" />
                    </div>
                  </div>
                  <button class="save-time-btn" @click="saveTimeSettings" :disabled="loading">
                    保存时间设置
                  </button>
                </div>

                <div class="reset-section">
                  <h3>重置双选数据</h3>
                  <p class="reset-warning">此操作将清空所有双选数据</p>
                  <button class="reset-button" @click="resetDoubleSelection" :disabled="loading">
                    <span v-if="loading">重置中...</span>
                    <span v-else>重置双选数据</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 导师管理 -->
          <div class="admin-section">
            <h2>导师管理</h2>
            <div class="teacher-management">
              <div class="teacher-actions">
                <button class="add-teacher-btn" @click="showAddTeacherDialog = true">
                  添加导师
                </button>
              </div>

              <div class="teacher-table-container">
                <table class="teacher-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>工号</th>
                      <th>专业</th>
                      <th>最小名额</th>
                      <th>最大名额</th>
                      <th>当前名额</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="teacher in doubleSelectionTeachers" :key="teacher.id">
                      <td>{{ teacher.realname }}</td>
                      <td>{{ teacher.username }}</td>
                      <td>{{ teacher.major }}</td>
                      <td>
                        <input
                          type="number"
                          v-model.number="teacher.min_quota"
                          @change="updateTeacherQuota(teacher.id, teacher.min_quota, teacher.max_quota)"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          v-model.number="teacher.max_quota"
                          @change="updateTeacherQuota(teacher.id, teacher.min_quota, teacher.max_quota)"
                        />
                      </td>
                      <td>{{ teacher.current_quota }}</td>
                      <td>
                        <button class="remove-btn" @click="removeTeacherFromDoubleSelection(teacher.id)">
                          移除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="doubleSelectionTeachers.length === 0" class="no-data">
                  暂无参与双选的导师
                </div>
              </div>
            </div>
          </div>

          <!-- 操作提示 -->
          <div class="admin-tips">
            <h3>操作提示</h3>
            <ul>
              <li>阶段0：双选准备阶段，学生和导师都不能进行操作</li>
              <li>阶段1：学生可以选择导师，导师不能进行操作</li>
              <li>阶段2：导师可以确认或拒绝学生的选择</li>
              <li>阶段3：双选完成，所有操作停止</li>
              <li>请根据实际情况合理设置双选阶段</li>
            </ul>
          </div>
        </div>

        <!-- 添加导师对话框 -->
        <div v-if="showAddTeacherDialog" class="dialog-overlay">
          <div class="dialog">
            <h3>添加导师</h3>
            <div class="dialog-content">
              <div class="search-section">
                <input
                  v-model="searchKeyword"
                  placeholder="搜索教师姓名或工号"
                  @keyup.enter="searchTeachersList"
                />
                <button @click="searchTeachersList">搜索</button>
              </div>

              <div v-if="searchTeachers.length > 0" class="search-results">
                <div
                  v-for="teacher in searchTeachers"
                  :key="teacher.id"
                  class="teacher-item"
                  @click="selectTeacher(teacher)"
                >
                  {{ teacher.realname }} ({{ teacher.username }}) - {{ teacher.major }}
                </div>
              </div>

              <div v-if="selectedTeacher" class="selected-teacher">
                <h4>已选择：{{ selectedTeacher.realname }} ({{ selectedTeacher.username }})</h4>
              </div>

              <div class="quota-settings">
                <div class="quota-input">
                  <label>最小名额：</label>
                  <input type="number" v-model.number="minQuota" min="0" />
                </div>
                <div class="quota-input">
                  <label>最大名额：</label>
                  <input type="number" v-model.number="maxQuota" min="1" />
                </div>
              </div>
            </div>
            <div class="dialog-actions">
              <button @click="showAddTeacherDialog = false">取消</button>
              <button @click="addTeacherToDoubleSelection" :disabled="!selectedTeacher || loading">
                {{ loading ? '添加中...' : '添加' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 校内用户注册 -->
        <div v-if="activeTab === 'user-registration'" class="tab-content">
          <div class="admin-section">
            <h2>校内用户注册</h2>
            <div class="user-registration-form">
              <div class="form-row">
                <div class="form-group">
                  <label>用户名（学号/工号）：</label>
                  <input type="text" v-model="newUser.username" placeholder="请输入学号/工号" />
                </div>
                <div class="form-group">
                  <label>真实姓名：</label>
                  <input type="text" v-model="newUser.realname" placeholder="请输入真实姓名" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>角色：</label>
                  <select v-model="newUser.role">
                    <option value="student">学生</option>
                    <option value="teacher">教师</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>院系：</label>
                  <input type="text" v-model="newUser.department" placeholder="请输入院系" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>身份证号：</label>
                  <input
                    type="text"
                    v-model="newUser.id_card"
                    placeholder="请输入身份证号（18位）"
                  />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>专业：</label>
                  <input type="text" v-model="newUser.major" placeholder="请输入专业" />
                </div>
                <div class="form-group">
                  <label>联系方式：</label>
                  <input type="text" v-model="newUser.contact" placeholder="请输入联系方式" />
                </div>
              </div>

              <div class="form-row" v-if="newUser.role === 'teacher'">
                <div class="form-group">
                  <label>职称：</label>
                  <input type="text" v-model="newUser.title" placeholder="请输入职称" />
                </div>
              </div>
              <div class="form-actions">
                <button class="register-btn" @click="registerInnerUser" :disabled="loading">
                  <span v-if="loading">注册中...</span>
                  <span v-else>注册用户</span>
                </button>
              </div>
            </div>

            <!-- 批量注册功能 -->
            <div class="batch-registration">
              <h3>批量注册</h3>
              <div class="batch-upload-section">
                <p>请上传Excel表格进行批量注册，表格应包含以下列：</p>
                <div class="template-download">
                  <a href="#" @click.prevent="downloadTemplate">下载模板文件</a>
                </div>
                <ul class="required-columns">
                  <li>英文表头：username | 中文表头：学号/工号</li>
                  <li>英文表头：realname | 中文表头：真实姓名</li>
                  <li>英文表头：role | 中文表头：角色（student/teacher/admin）</li>
                  <li>英文表头：id_card | 中文表头：身份证号（18位）</li>
                  <li>英文表头：department | 中文表头：院系</li>
                  <li>英文表头：major | 中文表头：专业</li>
                  <li>英文表头：contact | 中文表头：联系方式</li>
                  <li v-if="newUser.role === 'teacher'">英文表头：title | 中文表头：职称</li>
                </ul>
                <div class="file-upload">
                  <input
                    type="file"
                    ref="fileInput"
                    accept=".xlsx,.xls"
                    @change="handleFileUpload"
                  />
                  <button
                    class="batch-register-btn"
                    @click="batchRegister"
                    :disabled="loading || !selectedFile"
                  >
                    <span v-if="loading">批量注册中...</span>
                    <span v-else>批量注册</span>
                  </button>
                </div>
                <div v-if="selectedFile" class="selected-file">
                  <span>已选择文件：{{ selectedFile.name }}</span>
                  <button class="remove-file-btn" @click="removeFile">移除</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 科研训练管理 -->
        <div v-if="activeTab === 'research-training'" class="tab-content">
          <div class="admin-section">
            <h3>科研训练管理</h3>
            <div class="research-training-header">
              <div class="reset-section" style="margin-bottom: 20px">
                <h4>操作说明</h4>
                <div class="reset-warning">审核科研训练项目时请注意：</div>
                <ul class="reset-list">
                  <li>通过的项目将显示在学生的科研训练列表中</li>
                  <li>拒绝的项目将不会在系统中显示</li>
                  <li>请仔细审核项目信息的真实性和完整性</li>
                  <li>审核后无法修改，请谨慎操作</li>
                </ul>
              </div>
            </div>
            <div class="project-list-container">
              <div v-if="loadingProjects" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
              </div>
              <div v-else-if="pendingProjects.length === 0" class="empty-state">
                <p>暂无待审核项目</p>
              </div>
              <div v-else class="project-list">
                <table class="project-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th>操作</th>
                      <th>批次</th>
                      <th>研究题目</th>
                      <th>隶属科研项目</th>
                      <th>所属专业</th>
                      <th>所属院系</th>
                      <th>是否属于国家（教育部）重点实验室</th>
                      <th>所属国家（教育部）重点实验室</th>
                      <th>导师工号</th>
                      <th>导师姓名</th>
                      <th>导师所在院系</th>
                      <th>联系方式</th>
                      <th>招收学生人数</th>
                      <th>已报名人数</th>
                      <th>已确认人数</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="project in pendingProjects" :key="project.id">
                      <td><input type="checkbox" /></td>
                      <td class="operation">
                        <a href="#" class="view-project" @click.prevent="viewProject(project.id)"
                          >查看课题</a
                        >
                        <div class="approve-reject-buttons">
                          <button class="approve-btn" @click="approveProject(project.id)">
                            通过
                          </button>
                          <button class="reject-btn" @click="rejectProject(project.id)">
                            拒绝
                          </button>
                        </div>
                      </td>
                      <td>{{ project.batch }}</td>
                      <td>{{ project.direction }}</td>
                      <td>{{ project.projectName }}</td>
                      <td>{{ project.major }}</td>
                      <td>{{ project.department }}</td>
                      <td>{{ project.isNational ? '是' : '否' }}</td>
                      <td>{{ project.nationalLab || '-' }}</td>
                      <td>{{ project.teacherUsername }}</td>
                      <td>{{ project.teacherName }}</td>
                      <td>{{ project.teacherDepartment }}</td>
                      <td>{{ project.teacherContact }}</td>
                      <td>{{ project.maxStudents }}</td>
                      <td>{{ project.registeredCount || 0 }}</td>
                      <td>{{ project.confirmedCount || 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 公告管理 -->
        <!-- 企业审批 -->
        <div v-if="activeTab === 'company-review'" class="tab-content">
          <div class="admin-section">
            <h2>企业审批</h2>
            <div v-if="loadingCompanies" class="loading">加载中...</div>
            <div v-else-if="pendingCompanies.length === 0" class="empty-state">
              暂无待审批的企业
            </div>
            <div v-else class="company-list">
              <div v-for="company in pendingCompanies" :key="company.id" class="company-card">
                <div class="company-header">
                  <h3>{{ company.company_name }}</h3>
                  <span class="company-time">申请时间: {{ company.create_time }}</span>
                </div>
                <div class="company-info">
                  <div class="info-row">
                    <span class="info-label">企业账号：</span>
                    <span class="info-value">{{ company.username }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">联系人：</span>
                    <span class="info-value">{{ company.realname }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">联系方式：</span>
                    <span class="info-value">{{ company.contact }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">领域：</span>
                    <span class="info-value">{{ company.field }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">性质：</span>
                    <span class="info-value">{{ company.nature }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">规模：</span>
                    <span class="info-value">{{ company.scale }}</span>
                  </div>
                </div>
                <div class="company-actions">
                  <button
                    class="proof-btn"
                    @click="downloadProof(company.proof_file)"
                  >
                    📄 查看证明材料
                  </button>
                </div>
                <div class="review-section">
                  <div class="form-group">
                    <label>审核意见（选填，拒绝时必填）：</label>
                    <textarea
                      v-model="reviewComment"
                      placeholder="请输入审核意见"
                      rows="3"
                    ></textarea>
                  </div>
                  <div class="review-buttons">
                    <button
                      class="reject-btn"
                      @click="reviewCompany(company.id, 'reject')"
                      :disabled="loading"
                    >
                      拒绝
                    </button>
                    <button
                      class="approve-btn"
                      @click="reviewCompany(company.id, 'approve')"
                      :disabled="loading"
                    >
                      批准
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'announcement'" class="tab-content">
          <div class="admin-section">
            <div class="announcement-header">
              <h3>公告管理</h3>
              <button class="add-announcement-btn" @click="showAddAnnouncement = true">
                发布新公告
              </button>
            </div>

            <!-- 发布公告表单 -->
            <div v-if="showAddAnnouncement" class="add-announcement-form">
              <div class="form-group">
                <label>公告标题：</label>
                <input type="text" v-model="newAnnouncement.title" placeholder="请输入公告标题" />
              </div>
              <div class="form-group">
                <label>公告内容：</label>
                <textarea
                  v-model="newAnnouncement.content"
                  placeholder="请输入公告内容"
                  rows="5"
                ></textarea>
              </div>
              <div class="form-group">
                <label>附件：</label>
                <input type="file" multiple @change="handleFileChange" />
                <div v-if="newAnnouncement.attachments.length > 0" class="attachment-list">
                  <div
                    v-for="(file, index) in newAnnouncement.attachments"
                    :key="index"
                    class="attachment-item"
                  >
                    <span>{{ file.name }}</span>
                    <button
                      class="remove-attachment-btn"
                      @click="removeAttachment(index, false)"
                      :disabled="loading"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button class="cancel-btn" @click="showAddAnnouncement = false">取消</button>
                <button class="publish-btn" @click="publishAnnouncement" :disabled="loading">
                  {{ loading ? '发布中...' : '发布公告' }}
                </button>
              </div>
            </div>

            <!-- 编辑公告表单 -->
            <div v-if="showEditAnnouncement" class="add-announcement-form">
              <h3>编辑公告</h3>
              <div class="form-group">
                <label>公告标题：</label>
                <input
                  type="text"
                  v-model="editingAnnouncement.title"
                  placeholder="请输入公告标题"
                />
              </div>
              <div class="form-group">
                <label>公告内容：</label>
                <textarea
                  v-model="editingAnnouncement.content"
                  placeholder="请输入公告内容"
                  rows="5"
                ></textarea>
              </div>
              <div class="form-group">
                <label>附件：</label>
                <input type="file" multiple @change="handleFileChange" />
                <div
                  v-if="
                    editingAnnouncement.attachments && editingAnnouncement.attachments.length > 0
                  "
                  class="attachment-list"
                >
                  <div
                    v-for="(attachment, index) in editingAnnouncement.attachments"
                    :key="index"
                    class="attachment-item"
                  >
                    <span>{{ attachment.filename || attachment.name }}</span>
                    <button
                      class="remove-attachment-btn"
                      @click="removeAttachment(index, true)"
                      :disabled="loading"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button class="cancel-btn" @click="cancelEdit">取消</button>
                <button class="publish-btn" @click="saveEditAnnouncement" :disabled="loading">
                  {{ loading ? '保存中...' : '保存修改' }}
                </button>
              </div>
            </div>

            <!-- 公告列表 -->
            <div class="announcement-list-container">
              <div v-if="loadingAnnouncements" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
              </div>
              <div v-else-if="announcements.length === 0" class="empty-state">
                <p>暂无公告</p>
              </div>
              <div v-else class="announcement-list">
                <table class="announcement-table">
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>发布时间</th>
                      <th>附件</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="announcement in announcements" :key="announcement.id">
                      <td>{{ announcement.title }}</td>
                      <td>{{ announcement.created_at }}</td>
                      <td>
                        <div v-if="announcement.attachments && announcement.attachments.length > 0">
                          <div
                            v-for="(attachment, index) in announcement.attachments"
                            :key="index"
                            class="attachment-link"
                          >
                            <button
                              @click="downloadAttachment(attachment.id, attachment.filename)"
                              class="attachment-download-btn"
                            >
                              {{ attachment.filename }}
                            </button>
                          </div>
                        </div>
                        <span v-else>-</span>
                      </td>
                      <td class="operation">
                        <button class="edit-btn" @click="editAnnouncement(announcement)">
                          编辑
                        </button>
                        <button class="delete-btn" @click="deleteAnnouncement(announcement.id)">
                          删除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 课题详情弹窗 -->
        <div v-if="showProjectDetail" class="project-detail-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>课题详情</h2>
              <button class="close-btn" @click="closeProjectDetail">&times;</button>
            </div>
            <div class="modal-body">
              <!-- 课题信息 -->
              <div class="detail-section">
                <h3>课题信息</h3>
                <div class="detail-table">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="label">研究题目（方向）：</span>
                      <span class="value">{{ selectedProject?.direction }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">隶属科研项目名称：</span>
                      <span class="value">{{ selectedProject?.projectName }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">所属专业（学科）：</span>
                      <span class="value">{{ selectedProject?.major }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="label">所属院系：</span>
                      <span class="value">{{ selectedProject?.department }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">是否属于国家（教育部）重点实验室：</span>
                      <span class="value">{{ selectedProject?.isNational ? '是' : '否' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">所属国家（教育部）重点实验室：</span>
                      <span class="value">{{ selectedProject?.nationalLab || '-' }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="label">招收学生人数：</span>
                      <span class="value">{{ selectedProject?.maxStudents }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">已报名人数：</span>
                      <span class="value">{{ selectedProject?.registeredCount || 0 }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">已确认人数：</span>
                      <span class="value">{{ selectedProject?.confirmedCount || 0 }}</span>
                    </div>
                  </div>
                </div>
                <div class="project-description">
                  <h4>课题简介</h4>
                  <p>{{ selectedProject?.description }}</p>
                </div>
                <div class="registration-requirements">
                  <h4>报名要求</h4>
                  <p>{{ selectedProject?.requirements }}</p>
                </div>
              </div>
              <!-- 导师信息 -->
              <div class="detail-section">
                <h3>导师信息</h3>
                <div class="detail-table">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="label">导师工号：</span>
                      <span class="value">{{ selectedProject?.teacherUsername }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">导师姓名：</span>
                      <span class="value">{{ selectedProject?.teacherName }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">导师职称：</span>
                      <span class="value">{{ selectedProject?.teacherTitle }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="label">导师所在单位：</span>
                      <span class="value">{{ selectedProject?.teacherDepartment }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">联系方式：</span>
                      <span class="value">{{ selectedProject?.teacherContact }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">电子邮箱：</span>
                      <span class="value">{{ selectedProject?.teacherEmail }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-panel {
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

/* 标题样式 */
h1 {
  text-align: center;
  color: #2c3e50;
  font-size: 32px;
  margin-bottom: 40px;
  font-weight: 700;
  position: relative;
  padding-bottom: 15px;
}

h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

h2 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 25px;
  font-weight: 600;
  padding-left: 15px;
  border-left: 4px solid #667eea;
}

h3 {
  color: #34495e;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
}

/* 消息提示 */
.success-message {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(64, 192, 87, 0.3);
  animation: slideIn 0.3s ease;
}

.error-message {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(238, 90, 90, 0.3);
  animation: slideIn 0.3s ease;
}

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

/* 1-2布局 */
.layout-container {
  display: flex;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 600px;
}

/* 左侧标签栏 */
.left-sidebar {
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px 0;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  padding: 0 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 20px;
}

.sidebar-menu {
  padding: 0 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px 20px;
  margin: 10px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  font-weight: 500;
}

.menu-item:hover {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  color: #667eea;
  transform: translateX(5px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.menu-icon {
  font-size: 20px;
  width: 30px;
  text-align: center;
}

.menu-text {
  font-size: 14px;
  flex: 1;
}

/* 右侧内容区域 */
.right-content {
  flex: 1;
  min-width: 0;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 管理员区域 */
.admin-section {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

/* 双选管理内容 */
.double-selection-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.double-selection-left {
  flex: 1;
  min-width: 0;
}

.double-selection-right {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 阶段管理 */
.step-management {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .step-management {
    grid-template-columns: 1fr;
  }

  .double-selection-content {
    flex-direction: column;
  }

  .double-selection-right {
    width: 100%;
  }
}

.current-step {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #c7d2fe;
  margin-bottom: 20px;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.step-details {
  flex: 1;
}

.step-number {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  flex-shrink: 0;
}

.step-label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: block;
  margin-bottom: 4px;
}

.step-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 阶段选择器 */
.step-selector {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.step-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

@media (max-width: 480px) {
  .step-buttons {
    grid-template-columns: 1fr;
  }
}

.step-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.step-button:hover:not(:disabled) {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.step-button.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.step-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.step-button.loading {
  opacity: 0.8;
  cursor: wait;
}

.step-button-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.3s ease;
}

.step-button.active .step-button-number {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.step-button:hover:not(:disabled) .step-button-number {
  background: #667eea;
  color: white;
}

.step-button-label {
  font-weight: 500;
  font-size: 13px;
}

/* 导师管理 */
.teacher-management {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
}

.teacher-search {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.teacher-search input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.add-teacher-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-teacher-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.teacher-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.teacher-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.teacher-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.teacher-info {
  flex: 1;
}

.teacher-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.teacher-details {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.select-teacher-btn {
  padding: 8px 16px;
  background: #f8f9ff;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-teacher-btn:hover {
  background: #667eea;
  color: white;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
}

.selected-teacher-info {
  background: #f8f9ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #667eea;
}

.selected-teacher-info p {
  margin: 5px 0;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f8f9ff;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8ebff;
  border-color: #667eea;
  color: #667eea;
}

.confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 操作提示 */
.admin-tips {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;
  border: 1px solid #e0e0e0;
}

.admin-tips h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
}

.admin-tips ul {
  margin: 0;
  padding-left: 20px;
}

.admin-tips li {
  margin-bottom: 10px;
  color: #555;
  line-height: 1.5;
}

/* 重置双选数据 */
.reset-section {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #c7d2fe;
}

.reset-warning {
  color: #e74c3c;
  font-weight: 500;
  margin-bottom: 15px;
  font-size: 14px;
}

reset-list {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.reset-list li {
  padding: 6px 0;
  padding-left: 20px;
  position: relative;
  color: #555;
  font-size: 13px;
  line-height: 1.5;
}

.reset-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #e74c3c;
  font-size: 18px;
  line-height: 1;
}

.reset-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
  width: 100%;
  margin-top: 10px;
}

.reset-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3);
}

/* 时间设置 */
.time-settings {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.time-settings h3 {
  color: #34495e;
  font-size: 16px;
  margin-bottom: 15px;
  font-weight: 600;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.time-input-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.time-input-group input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s ease;
}

.time-input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.time-input-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.save-time-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.save-time-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.save-time-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.save-time-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* 占位内容 */
.placeholder-content {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 12px;
  border: 2px dashed #c7d2fe;
}

/* 校内用户注册表单样式 */
.user-registration-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}

.register-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.register-btn:hover {
  background-color: #0069d9;
}

.register-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* 批量注册样式 */
.batch-registration {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.batch-registration h3 {
  margin-bottom: 15px;
  color: #333;
}

.required-columns {
  margin-bottom: 20px;
  padding-left: 20px;
}

.required-columns li {
  margin-bottom: 5px;
  color: #666;
}

.file-upload {
  margin-bottom: 15px;
}

.file-upload input[type='file'] {
  margin-bottom: 10px;
}

.batch-register-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.batch-register-btn:hover {
  background-color: #218838;
}

.batch-register-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.selected-file {
  background-color: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remove-file-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.remove-file-btn:hover {
  background-color: #c82333;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 12px;
  border: 2px dashed #c7d2fe;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 12px;
  border: 2px dashed #c7d2fe;
}

/* 科研训练管理 */
.research-training-content {
  margin-top: 20px;
}

.project-list-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.project-list {
  margin-top: 0;
  border: none;
  border-radius: 0;
  overflow: hidden;
  max-height: 600px;
  overflow-y: auto;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

.project-table th,
.project-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-table th {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 10;
}

.project-table tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.project-table th:first-child,
.project-table td:first-child {
  width: 40px;
  text-align: center;
}

.project-table th:nth-child(2),
.project-table td:nth-child(2) {
  width: 200px;
}

.project-table th:nth-child(3),
.project-table td:nth-child(3) {
  width: 150px;
}

.project-table th:nth-child(4),
.project-table td:nth-child(4) {
  width: 200px;
}

.project-table th:nth-child(5),
.project-table td:nth-child(5) {
  width: 180px;
}

.project-table th:nth-child(6),
.project-table td:nth-child(6) {
  width: 120px;
}

.project-table th:nth-child(7),
.project-table td:nth-child(7) {
  width: 120px;
}

.project-table th:nth-child(8),
.project-table td:nth-child(8) {
  width: 180px;
}

.project-table th:nth-child(9),
.project-table td:nth-child(9) {
  width: 180px;
}

.project-table th:nth-child(10),
.project-table td:nth-child(10) {
  width: 100px;
}

.project-table th:nth-child(11),
.project-table td:nth-child(11) {
  width: 100px;
}

.project-table th:nth-child(12),
.project-table td:nth-child(12) {
  width: 120px;
}

.project-table th:nth-child(13),
.project-table td:nth-child(13) {
  width: 120px;
}

.project-table th:nth-child(14),
.project-table td:nth-child(14) {
  width: 100px;
}

.project-table th:nth-child(15),
.project-table td:nth-child(15) {
  width: 100px;
}

.project-table th:nth-child(16),
.project-table td:nth-child(16) {
  width: 100px;
}

.view-project {
  color: #667eea;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.view-project:hover {
  color: #764ba2;
  text-decoration: underline;
}

.operation {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 120px;
}

.approve-reject-buttons {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

/* 公告管理样式 */
.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-announcement-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-announcement-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.add-announcement-form {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #c7d2fe;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 8px;
}

.form-group input[type='text'],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input[type='text']:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.attachment-list {
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 14px;
}

.remove-attachment-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-attachment-btn:hover {
  background: linear-gradient(135deg, #ee5a5a 0%, #c0392b 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(238, 90, 90, 0.3);
}

.remove-attachment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.attachment-item:last-child {
  border-bottom: none;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #34495e;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.publish-btn {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.publish-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #40c057 0%, #37b24d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(64, 192, 87, 0.3);
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.announcement-list-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.announcement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

.announcement-table th,
.announcement-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.announcement-table th {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 10;
}

.announcement-table tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.attachment-link {
  margin: 5px 0;
}

.attachment-link a {
  color: #667eea;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s ease;
}

.attachment-link a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.attachment-download-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: none;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
  text-align: left;
}

.attachment-download-btn:hover {
  color: #764ba2;
  text-decoration: underline;
}

.edit-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 5px;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #45b7aa 0%, #3a9d93 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #ee5a5a 0%, #c0392b 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(238, 90, 90, 0.3);
}

.research-training-header {
  margin-bottom: 20px;
}

.approve-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.approve-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.reject-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reject-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.3);
}

/* 课题详情弹窗 */
.project-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 20px;
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 30px;
}

.detail-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h3 {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 4px solid #667eea;
}

.detail-section h4 {
  color: #34495e;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  margin-top: 20px;
}

.detail-table {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.detail-item {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-item .label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #666;
  flex: 1;
  word-break: break-word;
}

.project-description p,
.registration-requirements p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  text-align: justify;
}

.project-description {
  background: #f8f9ff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.registration-requirements {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #bbdefb;
  border-left: 4px solid #2196f3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
  }

  .sidebar-menu {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    padding: 0 20px;
  }

  .menu-item {
    white-space: nowrap;
    margin: 0;
  }

  .step-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .double-selection-content {
    flex-direction: column;
  }

  .double-selection-right {
    width: 100%;
  }

  .project-table {
    font-size: 12px;
  }

  .project-table th,
  .project-table td {
    padding: 8px 10px;
  }

  .operation {
    flex-direction: column;
    gap: 5px;
  }
}

/* 企业审批样式 */
.company-list {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.company-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
}

.company-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.company-time {
  color: #999;
  font-size: 13px;
}

.company-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  gap: 8px;
}

.info-label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.info-value {
  color: #333;
}

.company-actions {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.proof-btn {
  padding: 8px 16px;
  background: #f0f7ff;
  border: 1px solid #667eea;
  color: #667eea;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.proof-btn:hover {
  background: #667eea;
  color: white;
}

.review-section .form-group {
  margin-bottom: 15px;
}

.review-section .form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.review-section .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s;
}

.review-section .form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.review-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.reject-btn {
  padding: 10px 30px;
  background: white;
  border: 2px solid #f56c6c;
  color: #f56c6c;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.reject-btn:hover:not(:disabled) {
  background: #fef0f0;
}

.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.approve-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.approve-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(103, 194, 58, 0.4);
}

.approve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

/* 导师管理相关样式 */
.teacher-management {
  margin-top: 20px;
}

.teacher-actions {
  margin-bottom: 20px;
}

.add-teacher-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.add-teacher-btn:hover {
  background-color: #45a049;
}

.teacher-table-container {
  overflow-x: auto;
}

.teacher-table {
  width: 100%;
  border-collapse: collapse;
}

.teacher-table th,
.teacher-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.teacher-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.teacher-table tr:hover {
  background-color: #f5f5f5;
}

.teacher-table input {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.remove-btn {
  background-color: #f44336;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #da190b;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.dialog h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.search-section input {
  width: 70%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.search-section button {
  padding: 8px 16px;
  background-color: #008CBA;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.teacher-item {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.teacher-item:hover {
  background-color: #f5f5f5;
}

.selected-teacher {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f8ff;
  border-radius: 4px;
}

.quota-settings {
  margin-bottom: 20px;
}

.quota-input {
  margin-bottom: 10px;
}

.quota-input label {
  display: inline-block;
  width: 100px;
}

.quota-input input {
  width: 100px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-actions {
  text-align: right;
}

.dialog-actions button {
  padding: 8px 16px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-actions button:first-child {
  background-color: #f2f2f2;
}

.dialog-actions button:last-child {
  background-color: #4CAF50;
  color: white;
}
</style>
