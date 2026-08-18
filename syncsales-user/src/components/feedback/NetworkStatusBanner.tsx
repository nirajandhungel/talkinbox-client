/**
 * NetworkStatusBanner
 *
 * Displays a dismissable top banner when the browser loses network connection.
 * Automatically hides when the connection is restored.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatusBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showRestoredBanner, setShowRestoredBanner] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setShowRestoredBanner(false);
        };

        const handleOnline = () => {
            setIsOffline(false);
            setShowRestoredBanner(true);
            // Auto-hide the "connection restored" banner after 3 seconds
            const t = setTimeout(() => setShowRestoredBanner(false), 3000);
            return () => clearTimeout(t);
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isOffline && (
                <motion.div
                    key="offline"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-red-600 text-white text-xs font-semibold py-2 px-4 shadow-lg"
                >
                    <WifiOff size={13} className="shrink-0" />
                    <span>No internet connection. Some features may be unavailable.</span>
                </motion.div>
            )}
            {!isOffline && showRestoredBanner && (
                <motion.div
                    key="online"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-semibold py-2 px-4 shadow-lg"
                >
                    <Wifi size={13} className="shrink-0" />
                    <span>Connection restored.</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
