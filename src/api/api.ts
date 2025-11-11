import axios from "axios";

export const api = axios.create({
  baseURL: "https://floors-creativity-probe-ultimately.trycloudflare.com",
});

// Interceptor para garantir que FormData seja enviado corretamente
api.interceptors.request.use((config) => {
  // Se o data é FormData, garantir que o Content-Type seja definido corretamente
  if (config.data instanceof FormData) {
    // Remover qualquer Content-Type manual para que o browser defina automaticamente com boundary
    if (config.headers) {
      // Remover Content-Type para que o browser defina com boundary correto
      if ("Content-Type" in config.headers) {
        delete config.headers["Content-Type"];
      }
      if ("content-type" in config.headers) {
        delete (config.headers as Record<string, unknown>)["content-type"];
      }
    }
    // O axios deve detectar FormData automaticamente, mas vamos forçar a remoção
    // para garantir que o browser defina o boundary correto
  }
  return config;
});

export interface Toxina {
  _id: string;
  criado_em: string;
  nivel: number;
  nome: string;
  periculosidade: number;
  tipo: string;
}

export interface VerifyResponse {
  _id?: string;
  nivel: number;
  nome: string;
  imagem_base64: string;
  toxinas: Toxina[];
}
