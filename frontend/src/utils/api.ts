// API基础路径配置
export const getBaseURL = (): string => {
  return import.meta.env.MODE === 'development' ? 'http://localhost:5000' : ''
}

// 构建完整的API URL
export const buildURL = (endpoint: string): string => {
  const baseURL = getBaseURL()
  return `${baseURL}${endpoint}`
}
