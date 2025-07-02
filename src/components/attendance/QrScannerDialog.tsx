import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";

interface QrScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QrScannerDialog = ({ isOpen, onClose, onScan }: QrScannerDialogProps) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Check if camera is available
  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          setHasCamera(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          setHasCamera(false);
        });

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (
            videoRef.current.srcObject as MediaStream
          ).getTracks();
          tracks.forEach((track) => track.stop());
        }
      };
    }
  }, [isOpen]);

  // For demo purposes, simulate a QR code scan after 3 seconds
  useEffect(() => {
    if (scanning && isOpen) {
      const timer = setTimeout(() => {
        // Simulate finding a QR code with member ID 1
        onScan("1");
        setScanning(false);
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [scanning, isOpen, onScan, onClose]);

  const startScanning = () => {
    setScanning(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-400" />
            مسح رمز QR
          </DialogTitle>
          <Button
            className="absolute right-4 top-4 p-0 h-auto bg-transparent hover:bg-transparent"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {hasCamera ? (
            <>
              <div className="relative w-full aspect-square max-w-xs bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-blue-500 animate-pulse" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
                  </div>
                )}
              </div>

              {!scanning ? (
                <Button
                  onClick={startScanning}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  بدء المسح
                </Button>
              ) : (
                <p className="text-blue-400 animate-pulse">جاري المسح...</p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">لا يمكن الوصول إلى الكاميرا</p>
              <p className="text-gray-400 text-sm">
                يرجى التأكد من السماح بالوصول إلى الكاميرا وإعادة المحاولة
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScannerDialog;
