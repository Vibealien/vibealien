/**
 * API Client
 * Generic axios instance for API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '../constants'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    })

    // Add request interceptor to include auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                refreshToken,
              })
              localStorage.setItem('token', data.token)
              // Retry original request
              error.config.headers.Authorization = `Bearer ${data.token}`
              return this.instance.request(error.config)
            } catch (refreshError) {
              // Refresh failed, logout user
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              window.location.href = '/'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config)
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config)
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config)
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config)
  }
}

export const apiClient = new ApiClient()
