import axios from "axios";

export const api = axios.create({
  baseURL: "https://nomination-norman-packaging-reggae.trycloudflare.com",
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
