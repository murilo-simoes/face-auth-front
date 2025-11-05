import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, FlipHorizontal, X, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api, VerifyResponse } from "@/api/api";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CameraCapture = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [registerNome, setRegisterNome] = useState("");
  const [registerNivel, setRegisterNivel] = useState("");

  const startCamera = useCallback(() => {
    console.log("Tentando iniciar câmera...");
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Seu navegador não suporta câmera ou requer HTTPS");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then((mediaStream) => {
        setStream(mediaStream);
        setIsCameraActive(true);
        toast.success("Câmera ativada com sucesso!");
      })
      .catch((err) => {
        console.error("Erro ao acessar câmera:", err);
        toast.error("Não foi possível acessar a câmera");
      });
  }, [facingMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("play() falhou:", err);
      });
    }

    return () => {
      if (video && video.srcObject === stream) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    stopCamera();
    toast.success("Foto capturada!");
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => startCamera(), 200);
  }, [stopCamera, startCamera]);

  const handleValidate = useCallback(async () => {
    if (!capturedImage) return;

    toast.loading("Validando reconhecimento facial...");

    try {
      const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, "");
      const response = await api.post<VerifyResponse>("/verify", {
        imagem_base64: base64Data,
      });

      toast.dismiss();
      toast.success(`Reconhecimento validado! Olá, ${response.data.nome}!`);

      navigate("/profile", {
        state: {
          imageData: response.data.imagem_base64,
          nome: response.data.nome,
          nivel: response.data.nivel,
          userId: response.data._id,
        },
      });
    } catch (error) {
      toast.dismiss();

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Rosto não reconhecido no sistema.");
      } else {
        console.error("Erro ao validar rosto:", error);
        toast.error(
          "Erro ao validar reconhecimento facial, nenhum rosto encontrado."
        );
      }
    }
  }, [capturedImage, navigate]);

  const handleRegister = useCallback(() => {
    if (!capturedImage) return;
    setIsRegisterDialogOpen(true);
  }, [capturedImage]);

  const submitRegister = useCallback(async () => {
    if (!capturedImage || !registerNome.trim() || !registerNivel.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const nivel = parseInt(registerNivel, 10);
    if (isNaN(nivel) || nivel < 1 || nivel > 3) {
      toast.error("Selecione um nível válido");
      return;
    }

    toast.loading("Registrando nova pessoa...");

    try {
      const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, "");
      const response = await api.post<{
        mensagem: string;
        usuario: {
          _id: string;
          nome: string;
          nivel: number;
          imagem_base64: string;
        };
      }>("/register", {
        nome: registerNome.trim(),
        nivel: nivel,
        imagem_base64: base64Data,
      });

      toast.dismiss();
      toast.success(response.data.mensagem || "Pessoa registrada com sucesso!");

      setIsRegisterDialogOpen(false);
      setRegisterNome("");
      setRegisterNivel("");
      setCapturedImage(null);

      // Redirecionar para a página de perfil com os dados do usuário
      navigate("/profile", {
        state: {
          imageData: response.data.usuario.imagem_base64,
          nome: response.data.usuario.nome,
          nivel: response.data.usuario.nivel,
          userId: response.data.usuario._id,
        },
      });
    } catch (error) {
      toast.dismiss();
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.erro || error.message;
        toast.error(`Erro ao registrar: ${errorMessage}`);
      } else {
        console.error("Erro ao registrar pessoa:", error);
        toast.error("Erro ao registrar pessoa");
      }
    }
  }, [capturedImage, registerNome, registerNivel, navigate]);

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <div className="relative bg-muted aspect-[4/3] flex items-center justify-center">
        {!isCameraActive && !capturedImage && (
          <div className="text-center p-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Clique no botão abaixo para ativar a câmera
            </p>
            <Button
              onClick={startCamera}
              variant="hero"
              size="lg"
              type="button"
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              <Camera className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Ativar Câmera
            </Button>
          </div>
        )}

        {isCameraActive && !capturedImage && (
          <>
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-2 right-2 flex gap-2 sm:top-4 sm:right-4">
              <Button
                onClick={flipCamera}
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full shadow-md sm:h-10 sm:w-10"
              >
                <FlipHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={stopCamera}
                size="icon"
                variant="destructive"
                className="h-9 w-9 rounded-full shadow-md sm:h-10 sm:w-10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                size="lg"
                variant="hero"
                className="rounded-full px-8"
              >
                <Camera className="mr-2" /> Capturar Foto
              </Button>
            </div>
          </>
        )}

        {capturedImage && (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-0 right-0 w-full px-4 sm:bottom-6">
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <Button
                  onClick={handleValidate}
                  variant="hero"
                  size="lg"
                  className="w-full text-base py-6"
                >
                  <CheckCircle className="mr-2 w-5 h-5" />
                  <span className="hidden min-[375px]:inline">
                    Validar Reconhecimento
                  </span>
                  <span className="min-[375px]:hidden">Validar</span>
                </Button>

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    onClick={handleRegister}
                    variant="default"
                    size="lg"
                    className="w-full text-sm sm:text-base sm:flex-1"
                  >
                    <UserPlus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      Registrar Nova Pessoa
                    </span>
                    <span className="sm:hidden">Registrar</span>
                  </Button>

                  <Button
                    onClick={retakePhoto}
                    variant="secondary"
                    size="lg"
                    className="w-full text-sm sm:text-base sm:flex-1"
                  >
                    <span className="hidden sm:inline">Tirar Novamente</span>
                    <span className="sm:hidden">Novamente</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nova Pessoa</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma nova pessoa no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome"
                value={registerNome}
                onChange={(e) => setRegisterNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitRegister();
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nivel">Nível</Label>
              <Select value={registerNivel} onValueChange={setRegisterNivel}>
                <SelectTrigger id="nivel">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nível 1</SelectItem>
                  <SelectItem value="2">Nível 2</SelectItem>
                  <SelectItem value="3">Nível 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRegisterDialogOpen(false);
                setRegisterNome("");
                setRegisterNivel("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={submitRegister} variant="default">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
