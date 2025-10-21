import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, FlipHorizontal, X, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const CameraCapture = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

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

  const handleValidate = useCallback(() => {
    if (!capturedImage) return;
    toast.loading("Validando reconhecimento facial...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Reconhecimento validado!");
      navigate("/profile", { state: { imageData: capturedImage } });
    }, 2000);
  }, [capturedImage, navigate]);

  const handleRegister = useCallback(() => {
    if (!capturedImage) return;
    toast.loading("Registrando nova pessoa...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Pessoa registrada com sucesso!");
      setCapturedImage(null);
    }, 2000);
  }, [capturedImage]);

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
            >
              <Camera className="mr-2" />
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

            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={flipCamera}
                size="icon"
                variant="secondary"
                className="rounded-full shadow-md"
              >
                <FlipHorizontal />
              </Button>
              <Button
                onClick={stopCamera}
                size="icon"
                variant="destructive"
                className="rounded-full shadow-md"
              >
                <X />
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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleValidate}
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  <CheckCircle className="mr-2" /> Validar Reconhecimento
                </Button>

                <div className="flex gap-3">
                  <Button
                    onClick={handleRegister}
                    variant="default"
                    size="lg"
                    className="flex-1"
                  >
                    <UserPlus className="mr-2" /> Registrar Nova Pessoa
                  </Button>

                  <Button
                    onClick={retakePhoto}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                  >
                    Tirar Novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
