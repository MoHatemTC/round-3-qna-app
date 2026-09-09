export default function SplashScreen({ visible }) {
    return (
        <div
            aria-hidden={!visible}
            className={`fixed inset-0 z-100 flex items-center justify-center bg-background transition-opacity duration-500 ${
                visible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
            <span className="animate-splash-pulse font-heading text-5xl font-black tracking-tight text-foreground sm:text-6xl">
                Quizgate
            </span>
        </div>
    );
}
