import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // 💡 .env 파일의 환경 변수를 읽어옵니다.
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:3000';
    const cleanTarget = apiTarget.replace(/\/$/, ''); // 끝자리 슬래시 제거

    // 💡 .env에서 포트 번호를 동적으로 가져옵니다. (기본값: 5173)
    const port = Number(env.VITE_PORT) || 5173;

    return {
        plugins: [react()],
        server: {
            host: true,
            strictPort: false, // 💡 true로 설정 시 이미 포트가 차 있으면 서버가 크래시납니다. false로 두어 안전하게 다음 빈 포트를 잡도록 유도합니다!
            port: port,
            // 💡 프록시도 동적 API 서버 주소를 완벽하게 매핑
            proxy: {
                '/api': {
                    target: cleanTarget,
                    changeOrigin: true,
                    secure: false,
                },
                '/uploads': {
                    target: cleanTarget,
                    changeOrigin: true,
                    secure: false,
                }
            }
        },
        preview: {
            host: true,
            port: port,
            strictPort: false,
            proxy: {
                '/api': {
                    target: cleanTarget,
                    changeOrigin: true,
                    secure: false,
                },
                '/uploads': {
                    target: cleanTarget,
                    changeOrigin: true,
                    secure: false,
                }
            }
        }
    }
})
