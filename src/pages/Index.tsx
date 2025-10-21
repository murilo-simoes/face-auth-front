import { useState } from "react";
import { Leaf, Camera, Smartphone } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import heroImage from "@/assets/hero-nature.jpg";

const Index = () => {
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImageData(imageData);
    // Aqui você pode enviar para sua API de reconhecimento facial
    console.log("Imagem capturada pronta para envio à API:", imageData.substring(0, 50) + "...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary font-medium mb-4">
              <Leaf className="w-4 h-4" />
              Tecnologia para o Meio Ambiente
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Reconhecimento Facial para{" "}
              <span className="text-primary">Conservação Ambiental</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Use nossa tecnologia de reconhecimento facial para registrar participação em ações ambientais e criar um futuro mais sustentável
            </p>
          </div>
        </div>
      </section>

      {/* Camera Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full text-accent-foreground font-medium mb-4">
              <Camera className="w-4 h-4" />
              Capture sua Participação
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Registre-se com Facilidade
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tire uma foto para confirmar sua participação nas ações ambientais. 
              Nossa tecnologia de reconhecimento facial garante segurança e praticidade.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <CameraCapture onCapture={handleCapture} />
          </div>

          {capturedImageData && (
            <div className="mt-8 p-6 bg-card rounded-lg border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-sm text-muted-foreground text-center">
                ✓ Foto capturada com sucesso! Pronta para envio à API de reconhecimento facial.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Camera,
              title: "Captura Simples",
              description: "Interface intuitiva para capturar fotos rapidamente com sua câmera",
            },
            {
              icon: Leaf,
              title: "Sustentável",
              description: "Tecnologia a serviço da preservação ambiental e consciência ecológica",
            },
            {
              icon: Smartphone,
              title: "Mobile First",
              description: "Funciona perfeitamente em dispositivos móveis e desktops",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground text-sm">
            © 2025 Projeto Ambiental - Tecnologia para um futuro sustentável
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
