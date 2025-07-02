import { useContext, useEffect, useState } from "react";
import { NetworkStatusContext } from "../../main";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show online status briefly
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      {!isOnline ? (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>أنت غير متصل بالإنترنت</AlertTitle>
          <AlertDescription>
            التطبيق يعمل الآن في وضع عدم الاتصال. ستتم مزامنة البيانات عند
            استعادة الاتصال.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <Wifi className="h-4 w-4" />
          <AlertTitle>تم استعادة الاتصال</AlertTitle>
          <AlertDescription>
            أنت متصل بالإنترنت الآن وتتم مزامنة البيانات.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
