import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Leaf, Calendar, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const imageData = location.state?.imageData;

  useEffect(() => {
    if (!imageData) {
      navigate("/");
    }
  }, [imageData, navigate]);

  // Dados simulados - aqui viriam da sua API
  const profileData = {
    name: "Participante Ambiental",
    participationDate: "15 de Janeiro, 2025",
    location: "Parque Nacional da Tijuca, RJ",
    actionsCompleted: 12,
    treesPlanted: 8,
    wasteCollected: "25kg",
    status: "Verificado",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Card */}
          <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
            <div className="bg-gradient-to-r from-primary to-primary-glow p-8 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-medium">Reconhecimento Validado</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {profileData.name}
              </h1>
              <p className="text-primary-foreground/90">
                Participante ativo em ações de conservação ambiental
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-8">
              {/* Captured Photo */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Foto Verificada
                </h3>
                {imageData && (
                  <img
                    src={imageData}
                    alt="Perfil verificado"
                    className="w-full rounded-lg shadow-md object-cover aspect-square"
                  />
                )}
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Última Participação</p>
                      <p className="font-medium">{profileData.participationDate}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Local</p>
                      <p className="font-medium">{profileData.location}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-primary">{profileData.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">
                {profileData.actionsCompleted}
              </p>
              <p className="text-sm text-muted-foreground">Ações Completadas</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-6 h-6 text-accent-foreground" />
              </div>
              <p className="text-3xl font-bold text-accent-foreground mb-1">
                {profileData.treesPlanted}
              </p>
              <p className="text-sm text-muted-foreground">Árvores Plantadas</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">
                {profileData.wasteCollected}
              </p>
              <p className="text-sm text-muted-foreground">Resíduos Coletados</p>
            </Card>
          </div>

          {/* Activity History */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-primary" />
              Histórico de Atividades
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  title: "Plantio de Mudas Nativas",
                  date: "15 Jan 2025",
                  location: "Parque Nacional",
                },
                {
                  title: "Limpeza de Praias",
                  date: "08 Jan 2025",
                  location: "Praia de Copacabana",
                },
                {
                  title: "Educação Ambiental",
                  date: "22 Dez 2024",
                  location: "Escola Municipal",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.location}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="hero"
              size="lg"
              className="flex-1"
            >
              Nova Validação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
