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

            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // 添加随机噪声
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 50 - 25; // 随机噪声强度
                data[i] += noise;     // Red
                data[i + 1] += noise; // Green
                data[i + 2] += noise; // Blue
            }

            // UV 偏移（颜色分离）
            for (let i = 0; i < data.length; i += 4) {
                const uvOffset = Math.sin(i / 100) * 5; // 动态偏移
                data[i] += uvOffset;     // Red 偏移
                data[i + 1] -= uvOffset; // Green 偏移
                data[i + 2] += uvOffset; // Blue 偏移
            }

            // 创建桶形失真图像数据
            const newImageData = ctx.createImageData(width, height);
            const newData = newImageData.data;

            // 桶形失真参数
            const k = 0.00001; // 桶形失真强度（可以调整）
            const centerX = width / 2;
            const centerY = height / 2;

            // 应用桶形失真
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // 转换到中心坐标系
                    const dx = x - centerX;
                    const dy = y - centerY;

                    // 计算极坐标
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const theta = Math.atan2(dy, dx);

                    // 桶形失真映射
                    const distortedR = r * (1 + k * r * r);
                    const srcX = Math.round(centerX + distortedR * Math.cos(theta));
                    const srcY = Math.round(centerY + distortedR * Math.sin(theta));

                    // 检查边界，避免越界
                    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                        const srcIndex = (srcY * width + srcX) * 4;
                        const destIndex = (y * width + x) * 4;

                        // 拷贝像素数据
                        newData[destIndex] = data[srcIndex];
                        newData[destIndex + 1] = data[srcIndex + 1];
                        newData[destIndex + 2] = data[srcIndex + 2];
                        newData[destIndex + 3] = data[srcIndex + 3];
                    }
                }
            }

            // 绘制失真后的图像
            ctx.putImageData(newImageData, 0, 0);

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
