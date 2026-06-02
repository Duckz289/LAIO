import { supabase } from "./supabase";

const BASE_URL = "http://localhost:8000/api/v1";

async function getHeaders(): Promise<HeadersInit> {
  // Lấy session hiện tại
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Lỗi lấy session:", error);
  }
  
  const token = data.session?.access_token;
  
  // Debug - có thể bỏ comment khi cần kiểm tra
  // console.log("🔑 Token:", token ? `Có token (${token.substring(0, 30)}...)` : "KHÔNG có token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

// Hàm xử lý response
async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Nếu không parse được JSON, giữ nguyên message cũ
    }
    throw new Error(errorMessage);
  }
  
  // Nếu response 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  async get(endpoint: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body?: any) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async put(endpoint: string, body?: any) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async patch(endpoint: string, body?: any) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });
    return handleResponse(response);
  },
};