import { useRef, useState, useCallback } from "react";
import { Camera, FlipHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
        toast.success("Câmera ativada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      toast.error("Não foi possível acessar a câmera");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        stopCamera();
        onCapture?.(imageData);
        toast.success("Foto capturada!");
      }
    }
  }, [onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [stopCamera, startCamera]);

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <div className="relative bg-muted aspect-[4/3] flex items-center justify-center">
        {!isCameraActive && !capturedImage && (
          <div className="text-center p-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Clique no botão abaixo para ativar a câmera
            </p>
            <Button onClick={startCamera} variant="hero" size="lg">
              <Camera className="mr-2" />
              Ativar Câmera
            </Button>
          </div>
        )}

        {isCameraActive && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
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
                <Camera className="mr-2" />
                Capturar Foto
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              <Button onClick={retakePhoto} variant="secondary" size="lg">
                Tirar Novamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
