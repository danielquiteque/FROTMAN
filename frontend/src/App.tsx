import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Equipamentos } from "./pages/Equipamentos";
import { ReportarOcorrencia } from "./pages/ReportarOcorrencia";
import { OrdemServicoDetalhe } from "./pages/OrdemServicoDetalhe";
import { Historico } from "./pages/Historico";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="equipamentos" element={<Equipamentos />} />
        <Route path="ocorrencia/nova" element={<ReportarOcorrencia />} />
        <Route path="ordens/:id" element={<OrdemServicoDetalhe />} />
        <Route path="historico/:equipamentoId" element={<Historico />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
