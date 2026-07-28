import { ShaderBackground } from '@/components/shader-background-component';
export default function ShaderBackgroundDemo() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg">
      <ShaderBackground />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <h1 className="mb-4 text-center text-4xl font-bold text-white md:text-6xl">
          Shader Background
        </h1>
        <p className="max-w-2xl text-center text-lg text-white/80 md:text-xl">
          A beautiful animated WebGL shader background with plasma grid effects
          and dynamic wave patterns.
        </p>
      </div>
    </div>
  );
}
