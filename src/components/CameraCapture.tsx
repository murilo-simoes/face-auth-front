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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideoBlob, setCapturedVideoBlob] = useState<Blob | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
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

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    // Parar gravação se estiver gravando
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.dismiss();
    }

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

  const freezeLastFrame = useCallback((videoBlob: Blob) => {
    if (!canvasRef.current) return;

    const video = document.createElement("video");
    const url = URL.createObjectURL(videoBlob);

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    let hasSeeked = false;

    const extractFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas || hasSeeked) {
        return;
      }

      // Verificar se o vídeo tem dimensões válidas
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Dimensões do vídeo inválidas, tentando novamente...");
        setTimeout(() => {
          if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA
            extractFrame();
          }
        }, 100);
        return;
      }

      hasSeeked = true;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }

      try {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(dataUrl);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao desenhar frame no canvas:", error);
        URL.revokeObjectURL(url);
        toast.error("Erro ao gerar preview do vídeo");
      }
    };

    video.onloadedmetadata = () => {
      // Aguardar um pouco para garantir que os metadados estão totalmente carregados
      if (video.duration && isFinite(video.duration)) {
        // Ir para o último frame (um pouco antes do fim para garantir que há frame)
        video.currentTime = Math.max(0, video.duration - 0.1);
      } else {
        // Se duration não estiver disponível, usar o último frame disponível
        video.currentTime = Number.MAX_SAFE_INTEGER;
      }
    };

    video.onseeked = () => {
      extractFrame();
    };

    video.onloadeddata = () => {
      // Fallback: se o seeked não disparar, tentar extrair após loadeddata
      if (!hasSeeked && video.readyState >= 2) {
        setTimeout(() => {
          if (!hasSeeked) {
            extractFrame();
          }
        }, 100);
      }
    };

    video.oncanplay = () => {
      // Outro fallback: se ainda não extraiu, tentar quando o vídeo pode ser reproduzido
      if (!hasSeeked && video.readyState >= 2) {
        setTimeout(() => {
          if (!hasSeeked) {
            extractFrame();
          }
        }, 200);
      }
    };

    video.onerror = (error) => {
      console.error("Erro ao carregar vídeo para preview:", error);
      URL.revokeObjectURL(url);
      toast.error("Erro ao gerar preview do vídeo");
    };

    // Timeout de segurança: se após 3 segundos não conseguir extrair, usar fallback
    setTimeout(() => {
      if (!hasSeeked && video.readyState >= 2) {
        console.warn("Timeout ao extrair frame, tentando fallback...");
        extractFrame();
      }
    }, 3000);
  }, []);

  const captureVideo = useCallback(() => {
    if (!stream || !videoRef.current) return;

    // Verificar se MediaRecorder é suportado
    if (typeof MediaRecorder === "undefined") {
      toast.error("Seu navegador não suporta gravação de vídeo");
      return;
    }

    // Determinar o tipo MIME suportado (webm é mais comum)
    let mimeType = "video/webm";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      mimeType = "video/webm;codecs=vp8";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    }

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps para qualidade razoável
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Normalizar o tipo MIME para apenas "video/webm" ou "video/mp4" (sem codecs)
        // O backend Flask só aceita esses tipos exatos
        const normalizedMimeType = mimeType.includes("webm")
          ? "video/webm"
          : "video/mp4";

        const blob = new Blob(recordedChunksRef.current, {
          type: normalizedMimeType,
        });

        // Validar tamanho do blob (máximo 15 MB)
        if (blob.size > 15 * 1024 * 1024) {
          toast.error("Vídeo muito grande. Tente novamente.");
          setIsRecording(false);
          return;
        }

        setCapturedVideoBlob(blob);

        // Criar preview do último frame
        freezeLastFrame(blob);

        setIsRecording(false);
        toast.dismiss();
        toast.success("Vídeo capturado!");
      };

      mediaRecorder.onerror = (event) => {
        console.error("Erro ao gravar vídeo:", event);
        toast.error("Erro ao gravar vídeo");
        setIsRecording(false);
        toast.dismiss();
      };

      // Iniciar gravação
      mediaRecorder.start();
      setIsRecording(true);

      // Mostrar toast de loading
      toast.loading("Capturando...", {
        id: "recording-toast",
      });

      // Parar após 3 segundos
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Erro ao iniciar gravação de vídeo");
      setIsRecording(false);
      toast.dismiss();
    }
  }, [stream, freezeLastFrame]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedVideoBlob(null);
    setIsValidating(false); // Resetar estado de validação
    recordedChunksRef.current = [];
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    startCamera();
  }, [startCamera]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => startCamera(), 200);
  }, [stopCamera, startCamera]);

  const handleValidate = useCallback(async () => {
    if (!capturedVideoBlob || isValidating) return;

    setIsValidating(true);
    toast.loading("Validando reconhecimento facial...");

    try {
      // Determinar formato do vídeo
      const videoFormat = capturedVideoBlob.type.includes("webm")
        ? "webm"
        : "mp4";
      const fileExtension = videoFormat === "webm" ? "webm" : "mp4";

      // Criar FormData
      const formData = new FormData();
      // Criar um File a partir do Blob para garantir que o tipo MIME seja preservado
      const videoFile = new File(
        [capturedVideoBlob],
        `capture.${fileExtension}`,
        {
          type: capturedVideoBlob.type,
        }
      );
      formData.append("video", videoFile);

      // Debug: verificar se o FormData está correto
      console.log("Enviando vídeo:", {
        size: capturedVideoBlob.size,
        type: capturedVideoBlob.type,
        format: videoFormat,
        fileType: videoFile.type,
        fileName: videoFile.name,
      });

      // Enviar vídeo via FormData
      // O interceptor do axios garante que o Content-Type seja definido corretamente pelo browser
      const response = await api.post<VerifyResponse>("/verify", formData, {
        headers: {
          "X-Video-Format": videoFormat,
        },
      });

      console.log("Response:", response.data);

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
      setIsValidating(false); // Reabilitar botões em caso de erro

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Rosto não reconhecido no sistema.");
      } else {
        console.error("Erro ao validar rosto:", error);
        toast.error(
          "Erro ao validar reconhecimento facial, nenhum rosto encontrado."
        );
      }
    }
  }, [capturedVideoBlob, navigate, isValidating]);

  const handleRegister = useCallback(() => {
    if (!capturedVideoBlob) return;
    setIsRegisterDialogOpen(true);
  }, [capturedVideoBlob]);

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
      // Extrair base64 da imagem capturada (preview do último frame do vídeo)
      const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, "");

      // Enviar imagem base64 via JSON (formato original do endpoint /register)
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
      setCapturedVideoBlob(null);

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
      <div className="relative bg-muted min-h-[70vh] sm:aspect-[4/3] flex items-center justify-center">
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
                disabled={isRecording}
              >
                <FlipHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={stopCamera}
                size="icon"
                variant="destructive"
                className="h-9 w-9 rounded-full shadow-md sm:h-10 sm:w-10"
                disabled={isRecording}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Button
                onClick={captureVideo}
                size="lg"
                variant="hero"
                className="rounded-full px-8"
                disabled={isRecording}
              >
                <Camera className="mr-2" />{" "}
                {isRecording ? "Gravando..." : "Capturar"}
              </Button>
            </div>
          </>
        )}

        {capturedImage && (
          <div className="relative w-full h-full min-h-[70vh] sm:min-h-0">
            <img
              src={capturedImage}
              alt="Preview do vídeo capturado"
              className="w-full h-full min-h-[70vh] sm:min-h-0 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-0 right-0 w-full px-4 sm:bottom-6">
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <Button
                  onClick={handleValidate}
                  variant="hero"
                  size="lg"
                  className="w-full text-base py-6"
                  disabled={isValidating}
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
                    disabled={isValidating}
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
                    disabled={isValidating}
                  >
                    <span className="hidden sm:inline">Tirar Novamente</span>
                    <span className="sm:hidden">Capturar Novamente</span>
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
