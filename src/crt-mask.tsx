import React, { useEffect, useRef } from "react";

interface CRTProps {
  children: React.ReactNode;
  scanlineIntensity?: number; // 扫描线强度
  noiseIntensity?: number; // 噪声强度
  distortionStrength?: number; // 桶形失真强度
}

const CRTScreen: React.FC<CRTProps> = ({
  children,
  scanlineIntensity = 0.3,
  noiseIntensity = 25,
  distortionStrength = 0.00000007,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0; // 动态滚动偏移

    const render = () => {
      const { width, height } = canvas;

      ctx.clearRect(0, 0, width, height);

      // 添加动态扫描线效果
      offset += 1;
      for (let y = 0; y < height; y += 4) {
        const alpha = scanlineIntensity + 0.2 * Math.sin((y + offset) * 0.05);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, y, width, 2);
      }

      // 获取原始图像数据
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 添加随机噪声
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * noiseIntensity - noiseIntensity / 2;
        data[i] += noise; // Red
        data[i + 1] += noise; // Green
        data[i + 2] += noise; // Blue
      }

      // 添加UV偏移（颜色分离效果）
      for (let i = 0; i < data.length; i += 4) {
        const uvOffset = Math.sin(i / 100) * 5; // 动态偏移
        data[i] += uvOffset; // Red 偏移
        data[i + 1] -= uvOffset; // Green 偏移
        data[i + 2] += uvOffset; // Blue 偏移
      }

      // 创建桶形失真图像数据
      const newImageData = ctx.createImageData(width, height);
      const newData = newImageData.data;

      const k = distortionStrength; // 桶形失真强度
      const centerX = width / 2;
      const centerY = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;

          const r = Math.sqrt(dx * dx + dy * dy);
          const theta = Math.atan2(dy, dx);

          const distortedR = r * (1 + k * r * r);
          const srcX = Math.round(centerX + distortedR * Math.cos(theta));
          const srcY = Math.round(centerY + distortedR * Math.sin(theta));

          const destIndex = (y * width + x) * 4;

          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIndex = (srcY * width + srcX) * 4;
            newData[destIndex] = data[srcIndex];
            newData[destIndex + 1] = data[srcIndex + 1];
            newData[destIndex + 2] = data[srcIndex + 2];
            newData[destIndex + 3] = data[srcIndex + 3];
          } else {
            // 填充失真区域外部为荧光黑色
            newData[destIndex] = 0; // Red
            newData[destIndex + 1] = 0; // Green
            newData[destIndex + 2] = 0; // Blue
            newData[destIndex + 3] = 255; // Alpha
          }
        }
      }

      // 将桶形失真后的图像数据绘制到画布
      ctx.putImageData(newImageData, 0, 0);

      // 再次绘制扫描线以保持连续性
      for (let y = 0; y < height; y += 4) {
        const alpha = scanlineIntensity + 0.1 * Math.sin((y + offset) * 0.05);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, y, width, 2);
      }

      // 添加闪烁效果
      const flicker = 0.98 + Math.random() * 0.04; // 亮度随机浮动
      ctx.globalAlpha = flicker;

      requestAnimationFrame(render);
    };

    render();
  }, [scanlineIntensity, noiseIntensity, distortionStrength]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {children}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CRTScreen;
