import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

export interface VerifyResponse {
  nivel: number;
  nome: string;
  imagem_base64: string;
}
