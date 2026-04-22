<template>
  <div class="train-view">
    <!-- 标题区域 -->
    <div class="title-section">
      <h1>科研训练</h1>
    </div>

    <!-- 主要内容区域：1-2布局 -->
    <div class="main-content">
      <!-- 左侧：标签栏 -->
      <div v-if="user" class="left-panel">
        <div class="menu-section">
          <h3 class="menu-title">科研训练</h3>
          <div
            v-for="item in (user.role === 'admin'
              ? adminMenuItems
              : isTeacher
                ? teacherMenuItems
                : isStudent
                  ? studentMenuItems
                  : menuItems
            ).filter((i) => i.category === '科研训练')"
            :key="item.name"
            class="menu-item"
            :class="{ active: activeMenu === item.name }"
            @click="handleMenuClick(item)"
          >
            <span class="menu-text">{{ item.name }}</span>
          </div>
        </div>

        <div class="menu-section">
          <h3 class="menu-title">实验教学管理</h3>
          <div
            v-for="item in (user.role === 'admin'
              ? adminMenuItems
              : isTeacher
                ? teacherMenuItems
                : isStudent
                  ? studentMenuItems
                  : menuItems
            ).filter((i) => i.category === '实验教学管理')"
            :key="item.name"
            class="menu-item"
            :class="{ active: activeMenu === item.name }"
            @click="handleMenuClick(item)"
          >
            <span class="menu-text">{{ item.name }}</span>
          </div>
        </div>
      </div>
      <div v-else class="loading-panel">
        <p>加载中...</p>
      </div>

      <!-- 右侧：内容区域 -->
      <div class="right-panel">
        <!-- 科研训练内容 -->
        <div v-if="activeMenu === '科研训练'" class="research-content">
          <!-- 子标签页 -->
          <div class="sub-tabs">
            <div
              class="sub-tab"
              :class="{ active: activeSubTab === 'registration' }"
              @click="activeSubTab = 'registration'"
            >
              课题报名
            </div>
            <div
              v-if="isTeacher"
              class="sub-tab"
              :class="{ active: activeSubTab === 'my-projects' }"
              @click="activeSubTab = 'my-projects'"
            >
              我的课题
            </div>
            <div
              v-if="isStudent"
              class="sub-tab"
              :class="{ active: activeSubTab === 'confirmed' }"
              @click="activeSubTab = 'confirmed'"
            >
              已确认课题
            </div>
          </div>

          <!-- 课题报名页面 -->
          <div v-if="activeSubTab === 'registration'" class="registration-page">
            <!-- 搜索筛选区域 -->
            <div class="search-filter">
              <div class="filter-row">
                <div class="filter-item">
                  <label>批次：</label>
                  <select v-model="filter.batch">
                    <option value="">请选择</option>
                    <option value="2025-2026学年春季">2025-2026学年春季</option>
                    <option value="2024-2025学年秋季">2024-2026学年秋季</option>
                  </select>
                </div>
                <div class="filter-item">
                  <label>研究题目（方向）：</label>
                  <input type="text" v-model="filter.direction" placeholder="请输入研究方向" />
                </div>
                <div class="filter-item">
                  <label>导师工号：</label>
                  <input
                    type="text"
                    v-model="filter.teacherUsername"
                    placeholder="请输入导师工号"
                  />
                </div>
              </div>
              <div class="filter-row">
                <div class="filter-item">
                  <label>导师姓名：</label>
                  <input type="text" v-model="filter.teacherName" placeholder="请输入导师姓名" />
                </div>
                <div class="filter-item search-btn">
                  <button @click="searchProjects">搜索</button>
                </div>
                <div class="filter-item">
                  <a href="#" class="clear-filter" @click.prevent="clearFilter">清空条件</a>
                </div>
              </div>
            </div>

            <!-- 报名要求 -->
            <div class="registration-info">
              <p>可报名最大班级数：1，请在报名前与导师联系</p>
            </div>

            <!-- 项目列表 -->
            <div class="project-list">
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
                  <tr v-for="project in currentProjects" :key="project.id">
                    <td><input type="checkbox" /></td>
                    <td class="operation">
                      <a href="#" @click.prevent="viewProject(project.id)">查看课题</a>
                      <span v-if="user.role === 'student'">|</span>

                      <span
                        v-if="project.registered && user.role === 'student'"
                        class="registered-badge"
                        >已报名</span
                      >
                      <a
                        v-else-if="user.role === 'student'"
                        href="#"
                        @click.prevent="registerProject(project.id)"
                        >报名</a
                      >
                    </td>
                    <td>{{ project.batch }}</td>
                    <td>{{ project.direction }}</td>
                    <td>{{ project.projectName }}</td>
                    <td>{{ project.major }}</td>
                    <td>{{ project.department }}</td>
                    <td>{{ project.isNational ? '是' : '否' }}</td>
                    <td>{{ project.isNational ? '国家自然科学基金' : '-' }}</td>
                    <td>{{ project.teacherUsername }}</td>
                    <td>{{ project.teacherName }}</td>
                    <td>{{ project.teacherDepartment }}</td>
                    <td>{{ project.teacherContact }}</td>
                    <td>{{ project.maxStudents }}</td>
                    <td>{{ project.registeredCount }}</td>
                    <td>{{ project.confirmedCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 分页 -->
            <div class="pagination">
              <div class="page-info">
                {{ (currentPage - 1) * pageSize + 1 }}-{{
                  Math.min(currentPage * pageSize, total)
                }}
                记录总数 {{ total }} 总页数 {{ totalPages }} 当前 {{ currentPage }}
              </div>
              <div class="page-buttons">
                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                  上一页
                </button>
                <template v-for="page in getPageNumbers()" :key="page">
                  <button v-if="page === '...'" disabled>{{ page }}</button>
                  <button
                    v-else
                    :class="{ active: page === currentPage }"
                    @click="changePage(page)"
                  >
                    {{ page }}
                  </button>
                </template>
                <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                  下一页
                </button>
              </div>
              <div class="page-size">
                每页
                <select v-model="pageSize" @change="handlePageSizeChange">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 已确认课题页面 -->
          <div v-if="activeSubTab === 'confirmed' && isStudent" class="confirmed-page">
            <div class="table-container">
              <table class="project-table">
                <thead>
                  <tr>
                    <th>批次</th>
                    <th>研究方向</th>
                    <th>项目名称</th>
                    <th>所属专业</th>
                    <th>所属院系</th>
                    <th>导师工号</th>
                    <th>导师姓名</th>
                    <th>导师所在院系</th>
                    <th>联系方式</th>
                    <th>申请时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingConfirmed">
                    <td colspan="10" class="loading-cell">
                      <p>加载中...</p>
                    </td>
                  </tr>
                  <tr v-else-if="confirmedProjects.length === 0">
                    <td colspan="10" class="empty-cell">
                      <p>暂无已确认的课题</p>
                    </td>
                  </tr>
                  <tr v-for="project in confirmedProjects" :key="project.id">
                    <td>{{ project.batch }}</td>
                    <td>{{ project.direction }}</td>
                    <td>{{ project.projectName }}</td>
                    <td>{{ project.major }}</td>
                    <td>{{ project.department }}</td>
                    <td>{{ project.teacherUsername }}</td>
                    <td>{{ project.teacherName }}</td>
                    <td>{{ project.teacherDepartment }}</td>
                    <td>{{ project.teacherContact }}</td>
                    <td>{{ project.createTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 我的课题页面 -->
          <div v-if="activeSubTab === 'my-projects' && isTeacher" class="confirmed-page">
            <div class="table-container">
              <table class="project-table">
                <thead>
                  <tr>
                    <th>批次</th>
                    <th>研究方向</th>
                    <th>项目名称</th>
                    <th>所属专业</th>
                    <th>所属院系</th>
                    <th>学生人数</th>
                    <th>申请时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingTeacherProjects">
                    <td colspan="7" class="loading-cell">
                      <p>加载中...</p>
                    </td>
                  </tr>
                  <tr v-else-if="teacherProjects.length === 0">
                    <td colspan="7" class="empty-cell">
                      <p>暂无我的课题</p>
                    </td>
                  </tr>
                  <tr v-for="project in teacherProjects" :key="project.id">
                    <td>{{ project.batch }}</td>
                    <td>{{ project.direction }}</td>
                    <td>
                      <a href="#" class="project-link" @click.prevent="viewProject(project.id)">{{
                        project.projectName
                      }}</a>
                    </td>
                    <td>{{ project.major }}</td>
                    <td>{{ project.department }}</td>
                    <td>{{ project.confirmedCount }}</td>
                    <td>{{ project.createTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 实验报告上传页面 -->
        <div v-else-if="activeMenu === '实验报告上传'" class="content-section">
          <h2>实验报告上传</h2>
          <p>欢迎来到实验报告上传页面</p>
        </div>

        <!-- 学生项目申请页面 -->
        <div v-else-if="activeMenu === '学生项目申请'" class="content-section">
          <h2>学生项目申请</h2>
          <p>学生项目申请功能开发中...</p>
        </div>

        <!-- 报名处理页面 -->
        <div v-else-if="activeMenu === '报名处理'" class="content-section">
          <h2>报名处理</h2>
          <div class="registration-processing">
            <div class="table-container">
              <table class="project-table">
                <thead>
                  <tr>
                    <th>项目名称</th>
                    <th>学生姓名</th>
                    <th>学号</th>
                    <th>专业</th>
                    <th>院系</th>
                    <th>联系电话</th>
                    <th>电子邮箱</th>
                    <th>申请时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingRegistrations">
                    <td colspan="9" class="loading-cell">
                      <p>加载中...</p>
                    </td>
                  </tr>
                  <tr v-else-if="pendingRegistrations.length === 0">
                    <td colspan="9" class="empty-cell">
                      <p>暂无待处理的报名请求</p>
                    </td>
                  </tr>
                  <tr v-for="registration in pendingRegistrations" :key="registration.id">
                    <td>{{ registration.projectName }}</td>
                    <td>{{ registration.studentName }}</td>
                    <td>{{ registration.studentUsername }}</td>
                    <td>{{ registration.studentMajor }}</td>
                    <td>{{ registration.studentDepartment }}</td>
                    <td>{{ registration.studentContact }}</td>
                    <td>{{ registration.studentEmail }}</td>
                    <td>{{ registration.createTime }}</td>
                    <td class="operation">
                      <button
                        class="approve-btn"
                        @click="handleRegistration(registration.id, 'approve')"
                      >
                        批准
                      </button>
                      <button
                        class="reject-btn"
                        @click="handleRegistration(registration.id, 'reject')"
                      >
                        拒绝
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 项目申请页面 -->
        <div v-else-if="activeMenu === '项目申请'" class="content-section">
          <h2>项目申请</h2>
          <div v-if="isTeacher" class="project-application-form">
            <h3>科研训练项目申请</h3>
            <div class="form-row">
              <div class="form-item">
                <label>批次：</label>
                <select v-model="projectForm.batch" required>
                  <option value="">请选择</option>
                  <option value="2025-2026学年春季">2025-2026学年春季</option>
                  <option value="2025-2026学年秋季">2025-2026学年秋季</option>
                </select>
              </div>
              <div class="form-item">
                <label>项目名称：</label>
                <input
                  type="text"
                  v-model="projectForm.projectName"
                  placeholder="请输入项目名称"
                  required
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>研究方向：</label>
                <input
                  type="text"
                  v-model="projectForm.direction"
                  placeholder="请输入研究方向"
                  required
                />
              </div>
              <div class="form-item">
                <label>招收学生人数：</label>
                <input type="number" v-model="projectForm.maxStudents" min="1" max="10" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>所属专业：</label>
                <input
                  type="text"
                  v-model="projectForm.major"
                  placeholder="请输入所属专业"
                  required
                />
              </div>
              <div class="form-item">
                <label>所属院系：</label>
                <input
                  type="text"
                  v-model="projectForm.department"
                  placeholder="请输入所属院系"
                  required
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item checkbox-item">
                <input type="checkbox" v-model="projectForm.isNational" id="isNational" />
                <label for="isNational">是否属于国家（教育部）重点实验室</label>
              </div>
              <div class="form-item" v-if="projectForm.isNational">
                <label>所属国家（教育部）重点实验室：</label>
                <input
                  type="text"
                  v-model="projectForm.nationalLab"
                  placeholder="请输入实验室名称"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full-width">
                <label>课题简介：</label>
                <textarea
                  v-model="projectForm.description"
                  placeholder="请输入课题简介"
                  rows="4"
                  required
                ></textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full-width">
                <label>报名要求：</label>
                <textarea
                  v-model="projectForm.requirements"
                  placeholder="请输入报名要求"
                  rows="2"
                  required
                ></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button class="submit-btn" @click="submitProjectApplication">提交申请</button>
            </div>
          </div>
          <div v-else>
            <p>只有教师可以申请科研训练项目</p>
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
                  <span class="value">{{
                    selectedProject?.isNational ? '国家自然科学基金' : '-'
                  }}</span>
                </div>
              </div>
            </div>

            <div class="project-description">
              <h4>课题简介</h4>
              <p>{{ projectDescription }}</p>
            </div>

            <div class="registration-requirements">
              <h4>报名要求</h4>
              <p>{{ registrationRequirements }}</p>
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
                  <span class="label">导师所在单位：</span>
                  <span class="value">{{ selectedProject?.teacherDepartment }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">联系方式：</span>
                  <span class="value">{{ selectedProject?.teacherContact }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">职称：</span>
                  <span class="value">{{ selectedProject?.teacherTitle || teacherTitle }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">电子邮箱：</span>
                  <span class="value">{{ selectedProject?.teacherEmail || teacherEmail }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeMenu = ref('科研训练')
const activeSubTab = ref('registration')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const showProjectDetail = ref(false)
const selectedProject = ref<any>(null)
const projectDescription = ref('')
const registrationRequirements = ref('')
const teacherTitle = ref('')
const teacherEmail = ref('')
const user = ref<any>(null)
const totalPages = ref(1)
const total = ref(0)
const confirmedProjects = ref<any[]>([])
const loadingConfirmed = ref(false)
const teacherProjects = ref<any[]>([])
const loadingTeacherProjects = ref(false)

const getConfirmedProjects = async () => {
  loadingConfirmed.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects/confirmed', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      confirmedProjects.value = result.projects
    }
  } catch (error) {
    console.error('获取已确认课题失败', error)
  } finally {
    loadingConfirmed.value = false
  }
}

const getTeacherProjects = async () => {
  loadingTeacherProjects.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects/teacher', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      teacherProjects.value = result.projects
    }
  } catch (error) {
    console.error('获取教师课题失败', error)
  } finally {
    loadingTeacherProjects.value = false
  }
}

const menuItems = ref([
  { category: '科研训练', name: '科研训练', path: 'train' },
  { category: '实验教学管理', name: '实验报告上传', path: 'report' },
  { category: '实验教学管理', name: '项目申请', path: 'project' },
])

const teacherMenuItems = ref([
  { category: '科研训练', name: '科研训练', path: 'train' },
  { category: '实验教学管理', name: '实验报告上传', path: 'report' },
  { category: '实验教学管理', name: '项目申请', path: 'project' },
  { category: '科研训练', name: '报名处理', path: 'registration' },
])

const studentMenuItems = ref([
  { category: '科研训练', name: '科研训练', path: 'train' },
  { category: '实验教学管理', name: '实验报告上传', path: 'report' },
  { category: '实验教学管理', name: '学生项目申请', path: 'student-project' },
])

const adminMenuItems = ref([
  { category: '科研训练', name: '科研训练', path: 'train' },
  { category: '实验教学管理', name: '实验报告上传', path: 'report' },
  { category: '实验教学管理', name: '项目申请', path: 'project' },
  { category: '科研训练', name: '报名处理', path: 'registration' },
])

const filter = ref({
  batch: '',
  direction: '',
  teacherUsername: '',
  teacherName: '',
})

// 项目申请表单
const projectForm = ref({
  batch: '',
  projectName: '',
  direction: '',
  maxStudents: 1,
  major: '',
  department: '',
  isNational: false,
  nationalLab: '',
  description: '',
  requirements: '',
})

const projects = ref<any[]>([])

// 获取当前登录用户信息
const getUserInfo = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/check-auth', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()
    if (result.success) {
      user.value = result.user
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

const getProjects = async () => {
  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects?all=true', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      projects.value = result.projects
      total.value = result.total
      totalPages.value = Math.ceil(result.total / pageSize.value)
      // 获取学生的报名状态（仅对学生）
      if (isStudent.value) {
        await getRegistrationStatus()
      }
    }
  } catch (error) {
    console.error('获取项目列表失败', error)
  } finally {
    loading.value = false
  }
}

const getRegistrationStatus = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects/registrations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      // 更新已报名项目的状态
      const registeredProjectIds = result.projects.map((p: any) => p.id)
      projects.value = projects.value.map((project: any) => ({
        ...project,
        registered: registeredProjectIds.includes(project.id),
      }))
    }
  } catch (error) {
    console.error('获取报名状态失败', error)
  }
}

const isTeacher = computed(() => {
  return user.value?.role === 'teacher'
})

const isStudent = computed(() => {
  return user.value?.role === 'student'
})

const currentProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return projects.value.slice(start, end)
})

const handleMenuClick = (item: any) => {
  activeMenu.value = item.name
}

const searchProjects = async () => {
  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const params = new URLSearchParams()
    if (filter.value.batch) params.append('batch', filter.value.batch)
    if (filter.value.direction) params.append('direction', filter.value.direction)
    if (filter.value.projectName) params.append('projectName', filter.value.projectName)
    if (filter.value.teacherUsername) params.append('teacherUsername', filter.value.teacherUsername)
    if (filter.value.teacherName) params.append('teacherName', filter.value.teacherName)
    params.append('all', 'true')

    const response = await fetch(
      `http://localhost:5000/api/research-projects?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      },
    )
    const result = await response.json()
    if (result.success) {
      projects.value = result.projects
      total.value = result.total
      totalPages.value = Math.ceil(result.total / pageSize.value)
      // 获取学生的报名状态（仅对学生）
      if (isStudent.value) {
        await getRegistrationStatus()
      }
    }
  } catch (error) {
    console.error('搜索项目失败', error)
  } finally {
    loading.value = false
  }
}

const clearFilter = () => {
  filter.value = {
    batch: '',
    direction: '',
    teacherUsername: '',
    teacherName: '',
  }
  searchProjects()
}

const viewProject = async (projectId: number) => {
  console.log('查看项目:', projectId)
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(`http://localhost:5000/api/research-projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    const result = await response.json()
    if (result.success) {
      selectedProject.value = result.project
      projectDescription.value = result.project.description || ''
      registrationRequirements.value = result.project.requirements || ''
      showProjectDetail.value = true
    }
  } catch (error) {
    console.error('获取项目详情失败', error)
  }
}

const closeProjectDetail = () => {
  showProjectDetail.value = false
  selectedProject.value = null
}

const registerProject = async (projectId: number) => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    })
    const result = await response.json()
    if (result.success) {
      alert('报名成功')
      // 更新项目状态
      const project = projects.value.find((p) => p.id === projectId)
      if (project) {
        project.registered = true
      }
      // 重新获取项目列表以更新数据
      await getProjects()
    } else {
      alert('报名失败: ' + result.message)
    }
  } catch (error) {
    console.error('报名失败', error)
    alert('网络错误，请稍后重试')
  }
}

const submitProjectApplication = async () => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/research-projects/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(projectForm.value),
    })
    const result = await response.json()
    if (result.success) {
      alert('项目申请提交成功，等待管理员审核')
      // 重置表单
      projectForm.value = {
        batch: '',
        projectName: '',
        direction: '',
        maxStudents: 1,
        major: '',
        department: '',
        isNational: false,
        nationalLab: '',
        description: '',
        requirements: '',
      }
    } else {
      alert('提交失败: ' + result.message)
    }
  } catch (error) {
    console.error('提交项目申请失败', error)
    alert('网络错误，请稍后重试')
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  totalPages.value = Math.ceil(projects.value.length / pageSize.value)
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const getPageNumbers = () => {
  const pages = []
  const maxVisiblePages = 5

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    const startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)

    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) {
        pages.push('...')
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages.value) {
      if (endPage < totalPages.value - 1) {
        pages.push('...')
      }
      pages.push(totalPages.value)
    }
  }

  return pages
}

const pendingRegistrations = ref<any[]>([])
const loadingRegistrations = ref(false)

const getPendingRegistrations = async () => {
  loadingRegistrations.value = true
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(
      'http://localhost:5000/api/research-projects/registrations/pending',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      },
    )
    const result = await response.json()
    if (result.success) {
      pendingRegistrations.value = result.registrations
    }
  } catch (error) {
    console.error('获取待处理报名失败', error)
  } finally {
    loadingRegistrations.value = false
  }
}

const handleRegistration = async (registrationId: number, action: 'approve' | 'reject') => {
  try {
    const token = sessionStorage.getItem('token')
    const response = await fetch(
      `http://localhost:5000/api/research-projects/registrations/${registrationId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ registrationId, action }),
      },
    )
    const result = await response.json()
    if (result.success) {
      alert(`报名请求${action === 'approve' ? '已批准' : '已拒绝'}`)
      await getPendingRegistrations()
    } else {
      alert('处理失败: ' + result.message)
    }
  } catch (error) {
    console.error('处理报名失败', error)
    alert('网络错误，请稍后重试')
  }
}

onMounted(async () => {
  console.log('科研训练页面加载')
  await getUserInfo()
  await getProjects()
  // 如果是学生，获取已确认课题
  if (isStudent.value) {
    await getConfirmedProjects()
  }
  // 如果是教师，获取我的课题
  if (isTeacher.value) {
    await getTeacherProjects()
  }
  // 计算总页数
  totalPages.value = Math.ceil(projects.value.length / pageSize.value)
  total.value = projects.value.length
  // 如果是教师或管理员，获取待处理报名
  if (isTeacher.value || user.value?.role === 'admin') {
    await getPendingRegistrations()
  }
})
</script>

<style scoped>
.train-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin-top: 20px;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.title-section h1 {
  color: #2c3e50;
  font-size: 32px;
  font-weight: 700;
  position: relative;
  display: inline-block;
  padding-bottom: 15px;
}

.title-section h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

/* 主要内容区域：1-2布局 */
.main-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

/* 左侧：标签栏 */
.left-panel {
  width: 250px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.menu-section {
  margin-bottom: 25px;
}

.menu-title {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-left: 15px;
  border-left: 4px solid #667eea;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(5px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.loading-panel {
  width: 250px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  text-align: center;
  color: #666;
}

/* 右侧：内容区域 */
.right-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

/* 子标签页 */
.sub-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.sub-tab {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.sub-tab:hover {
  color: #667eea;
}

.sub-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

/* 搜索筛选区域 */
.search-filter {
  background: #f8f9ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
}

.filter-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.filter-item input,
.filter-item select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.filter-item input:focus,
.filter-item select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.search-btn button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 36px;
}

.search-btn button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.filter-item a {
  color: #667eea;
  font-size: 12px;
  margin-right: 10px;
  text-decoration: none;
  cursor: pointer;
}

.filter-item a:hover {
  text-decoration: underline;
}

/* 报名要求 */
.registration-info {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #2196f3;
}

.registration-info p {
  margin: 0;
  font-size: 14px;
  color: #1565c0;
  line-height: 1.5;
}

/* 项目列表 */
.project-list {
  margin-bottom: 20px;
  max-height: 400px;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.project-table th,
.project-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.project-table th {
  background: #f8f9ff;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 1;
}

.project-table td {
  color: #666;
}

.project-table td.operation {
  white-space: nowrap;
}

.project-table td.operation a {
  color: #667eea;
  text-decoration: none;
  margin-right: 5px;
  margin-left: 5px;
}

.project-table td.operation a:hover {
  text-decoration: underline;
}

.project-table td.operation a.disabled {
  color: #999;
  cursor: not-allowed;
}

.project-table td.operation .registered-badge {
  color: #4caf50;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(76, 175, 80, 0.1);
}

.project-table tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.page-info {
  font-size: 13px;
  color: #666;
}

.page-buttons {
  display: flex;
  gap: 5px;
}

.page-buttons button {
  padding: 5px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-buttons button:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-size select {
  padding: 5px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .right-panel {
    width: 100%;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .project-table {
    font-size: 12px;
  }

  .project-table th,
  .project-table td {
    padding: 8px;
  }
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

/* 响应式设计 - 弹窗 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .modal-body {
    padding: 20px;
  }

  .detail-row {
    flex-direction: column;
    gap: 10px;
  }

  .detail-item {
    min-width: 100%;
  }

  .detail-item .label {
    min-width: 100px;
  }
}

/* 项目申请表单 */
.project-application-form {
  background: #f8f9ff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  margin-top: 20px;
}

.project-application-form h3 {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 25px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.project-application-form h3::before {
  content: '|';
  margin-right: 10px;
  color: white;
  font-weight: bold;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item.full-width {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-item.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.form-item.checkbox-item input[type='checkbox'] {
  width: auto;
  margin: 0;
  transform: scale(1.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

/* 报名处理 */
.registration-processing {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

.processing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.processing-header h3 {
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.count-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
}

.empty-state p {
  font-size: 16px;
  color: #999;
}

.registration-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.registration-item {
  background: #f8f9ff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  border-bottom: 1px solid #e0e0e0;
}

.item-header h4 {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.item-body {
  padding: 20px;
}

.student-info {
  margin-bottom: 20px;
}

.student-info p {
  margin: 10px 0;
  font-size: 14px;
  color: #34495e;
  line-height: 1.6;
}

.student-info p strong {
  color: #2c3e50;
  width: 100px;
  display: inline-block;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.time {
  font-size: 13px;
  color: #999;
}

.actions {
  display: flex;
  gap: 10px;
}

.approve-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.approve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.reject-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reject-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 表格容器 */
.table-container {
  max-height: 500px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.project-table thead {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
  position: sticky;
  top: 0;
  z-index: 1;
}

.project-table th {
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.project-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e0e0e0;
  color: #34495e;
}

.project-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 40px !important;
  color: #666;
}

.loading-cell p,
.empty-cell p {
  font-size: 16px;
  color: #999;
}

.operation {
  white-space: nowrap;
}

.operation .approve-btn {
  margin-right: 5px;
}

.operation .reject-btn {
  margin-left: 5px;
}

.project-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.project-link:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
