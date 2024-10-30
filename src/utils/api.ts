import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
}

class ApiError extends Error {
	status?: number;
	code?: string;
	data?: any;

	constructor(message: string, status?: number, code?: string, data?: any) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.data = data;
	}

	isUnauthorized(): boolean {
		return this.status === 401;
	}

	isForbidden(): boolean {
		return this.status === 403;
	}

	isNotFound(): boolean {
		return this.status === 404;
	}
}

class ApiClient {
	private client: AxiosInstance;

	constructor(baseURL: string = 'https://english.amirsalarsafaei.com/api') {
		this.client = axios.create({
			baseURL,
			headers: {
				'Content-Type': 'application/json',
			},
			withCredentials: true,
		});

		this.client.interceptors.request.use(
			(config) => {
				// Add auth headers if token exists
				const token = localStorage.getItem('token');
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}

				if (config.method !== 'get') {
					const csrfToken = this.getCsrfToken();
					if (csrfToken) {
						config.headers['X-CSRFToken'] = csrfToken;
					}
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		this.client.interceptors.response.use(
			(response) => response,
			(error) => {
				const apiError = new ApiError(
					error.response?.data?.detail || error.message || 'An error occurred',
					error.response?.status,
					error.response?.data?.code,
					error.response?.data
				);
				return Promise.reject(apiError);
			}
		);
	}

	private getCsrfToken(): string | null {
		const name = 'csrftoken';
		let cookieValue = null;
		if (document.cookie && document.cookie !== '') {
			const cookies = document.cookie.split(';');
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i].trim();
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}


	async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response: AxiosResponse<T> = await this.client.get(url, config);
		return {
			data: response.data,
			status: response.status,
			statusText: response.statusText,
		};
	}

	async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response: AxiosResponse<T> = await this.client.post(url, data, config);
		return {
			data: response.data,
			status: response.status,
			statusText: response.statusText,
		};
	}

	async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response: AxiosResponse<T> = await this.client.put(url, data, config);
		return {
			data: response.data,
			status: response.status,
			statusText: response.statusText,
		};
	}

	async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response: AxiosResponse<T> = await this.client.patch(url, data, config);
		return {
			data: response.data,
			status: response.status,
			statusText: response.statusText,
		};
	}

	async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
		const response: AxiosResponse<T> = await this.client.delete(url, config);
		return {
			data: response.data,
			status: response.status,
			statusText: response.statusText,
		};
	}
}

const api = new ApiClient();
export default api;

export { ApiClient, ApiError };

