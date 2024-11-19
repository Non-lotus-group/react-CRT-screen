import React, { useEffect, useRef } from 'react';

interface CRTProps {
    children: React.ReactNode;
    //扫描线设置
    //噪音
    //颜色分离
    //桶装失真
    //闪烁
}

const CRTScreen: React.FC<CRTProps> = ({ children }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let offset = 0; // 动态滚动偏移

        const render = () => {
            const { width, height } = canvas;

            ctx.clearRect(0, 0, width, height);

            // 绘制扫描线
            offset += 1;
            for (let y = 0; y < height; y += 4) {
                const alpha = 0.2 + 0.1 * Math.sin((y + offset) * 0.05);
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fillRect(0, y, width, 2);
            }

            // 添加随机噪声
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 50 - 25; // 随机噪声强度
                data[i] += noise;     // Red
                data[i + 1] += noise; // Green
                data[i + 2] += noise; // Blue
            }

            for (let i = 0; i < data.length; i += 4) {
                const offset = Math.sin(i / 100) * 5; // 动态偏移
                data[i] += offset;     // Red 偏移
                data[i + 1] -= offset; // Green 偏移
                data[i + 2] += offset; // Blue 偏移
            }
            

            ctx.putImageData(imageData, 0, 0);

            requestAnimationFrame(render);
        };

        render();
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {children}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
};

export default CRTScreen;
