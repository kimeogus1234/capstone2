const fs = require('fs');
const os = require('os');
const path = require('path');

// ⚙️ 고정 IP 설정 여부
const USE_STATIC_IP = true; // 자동으로 IP를 감지하지 않고 아래 고정 주소를 사용하려면 true로 설정
const STATIC_IP = '211.254.215.186';
const SERVER_PORT = '3001';

/**
 * 📡 [자동 감지/고정] 서버 주소 설정에 맞춰 config.ts를 업데이트합니다.
 */
function updateIpAddress() {
    const configPath = path.join(__dirname, 'config.ts');

    if (USE_STATIC_IP) {
        const content = `// [고정 설정] 지정된 고정 IP 주소가 사용됩니다.\nexport const SERVER_IP = '${STATIC_IP}';\nexport const SERVER_PORT = '${SERVER_PORT}';\nexport const API_URL = \`http://\${SERVER_IP}:\${SERVER_PORT}/api\`;\n`;
        try {
            fs.writeFileSync(configPath, content, 'utf8');
            console.log(`📌 [고정 IP 적용] 고정 서버 주소가 설정되었습니다.`);
            console.log(`📡 SERVER_IP: ${STATIC_IP}`);
            console.log(`🔌 PORT: ${SERVER_PORT}`);
        } catch (error) {
            console.error('❌ [오류] config.ts 고정 주소 설정 중 에러 발생:', error.message);
        }
        return;
    }

    const interfaces = os.networkInterfaces();
    let currentIP = '127.0.0.1'; // 기본값

    // 모든 네트워크 인터페이스를 돌며 IPv4 주소를 찾습니다.
    for (const devName in interfaces) {
        // WSL, 가상머신 등의 네트워크 인터페이스는 무시합니다.
        if (devName.toLowerCase().includes('wsl') || devName.toLowerCase().includes('vmware') || devName.toLowerCase().includes('vethernet')) {
            continue;
        }

        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                currentIP = alias.address;
                break;
            }
        }
        if (currentIP !== '127.0.0.1') break;
    }

    const content = `// [자동 생성] 현재 PC의 IP로 자동 업데이트되었습니다.\nexport const SERVER_IP = '${currentIP}';\nexport const SERVER_PORT = '${SERVER_PORT}';\nexport const API_URL = \`http://\${SERVER_IP}:\${SERVER_PORT}/api\`;\n`;

    try {
        fs.writeFileSync(configPath, content, 'utf8');
        console.log(`✅ [성공] 서버 주소가 업데이트되었습니다: ${currentIP}`);
        console.log(`📡 SERVER_IP: ${currentIP}`);
        console.log(`🔌 PORT: ${SERVER_PORT}`);
    } catch (error) {
        console.error('❌ [오류] config.ts 업데이트 중 에러 발생:', error.message);
    }
}

updateIpAddress();
