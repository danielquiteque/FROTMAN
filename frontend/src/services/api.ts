import axios from "axios";

// Em desenvolvimento local, defina VITE_API_URL=http://127.0.0.1:8000 no .env
// (frontend e backend rodam em portas separadas).
// Em produção (container único, ex: Hugging Face Spaces), deixe vazio — o
// frontend e a API são servidos pelo mesmo host, então os caminhos ficam relativos.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
