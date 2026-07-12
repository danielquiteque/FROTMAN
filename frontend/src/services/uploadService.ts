import { api, API_BASE_URL } from "./api";

export const uploadService = {
  enviar: async (file: File): Promise<{ url: string; nome_original: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  urlCompleta: (caminhoRelativo: string) => `${API_BASE_URL}${caminhoRelativo}`,
};
