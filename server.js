const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    
    // GET 流式数据接口
    if (url === '/stream' && req.method === 'GET') {
        console.log('开始GET流式传输...');
        
        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // 模拟长文本数据
        const messages = [
            {
                title: "系统初始化",
                content: "正在启动系统核心模块，初始化基础配置参数，加载必要的系统组件，准备为您提供优质的服务体验。系统正在检查硬件资源，确保所有组件正常运行。"
            },
            {
                title: "数据库连接",
                content: "建立数据库连接池，配置连接参数，优化查询性能。系统正在验证数据库连接的稳定性，确保数据访问的可靠性和安全性。连接池已成功建立，准备处理数据请求。"
            },
            {
                title: "权限验证",
                content: "正在验证用户身份信息，检查访问权限级别，确保系统安全。系统将根据用户角色分配相应的访问权限，保护敏感数据不被非法访问。权限验证完成，用户可以安全访问系统资源。"
            },
            {
                title: "服务启动",
                content: "启动各个微服务模块，包括用户管理服务、数据处理服务、通知服务等。系统正在进行服务间的通信测试，确保各模块能够正常协作。所有服务模块已成功启动并运行正常。"
            },
            {
                title: "准备就绪",
                content: "系统已完成所有初始化工作，各项功能模块运行正常，准备为您提供完整的服务。感谢您的耐心等待，现在可以开始使用系统的各项功能了。"
            }
        ];

        let messageIndex = 0;
        let charIndex = 0;
        let isStreamingContent = false;
        
        // 处理客户端断开连接
        req.on('close', () => {
            console.log('GET客户端已断开连接');
            clearInterval(interval);
        });

        req.on('aborted', () => {
            console.log('GET请求被中止');
            clearInterval(interval);
        });

        // 发送开始事件
        res.write(`data: ${JSON.stringify({
            code: 1,
            type: 'start',
            data: { title: '开始传输', content: '准备开始流式传输数据...' },
            timestamp: new Date().toISOString()
        })}\n\n`);

        // 流式传输逻辑
        const interval = setInterval(() => {
            if (messageIndex >= messages.length) {
                // 发送结束事件
                res.write(`data: ${JSON.stringify({
                    code: 0,
                    type: 'end',
                    data: { title: '传输完成', content: '所有数据已传输完成' },
                    timestamp: new Date().toISOString()
                })}\n\n`);
                res.end();
                clearInterval(interval);
                console.log('GET流式传输完成');
                return;
            }

            const currentMessage = messages[messageIndex];
            
            if (!isStreamingContent) {
                // 发送标题
                res.write(`data: ${JSON.stringify({
                    code: 1,
                    type: 'title',
                    data: { title: currentMessage.title, content: '' },
                    timestamp: new Date().toISOString(),
                    progress: Math.round((messageIndex + 1) / messages.length * 100)
                })}\n\n`);
                isStreamingContent = true;
                charIndex = 0;
            } else {
                // 逐字符发送内容
                if (charIndex < currentMessage.content.length) {
                    const char = currentMessage.content[charIndex];
                    res.write(`data: ${JSON.stringify({
                        code: 1,
                        type: 'content',
                        data: { title: currentMessage.title, content: char },
                        timestamp: new Date().toISOString(),
                        progress: Math.round((messageIndex + 1) / messages.length * 100)
                    })}\n\n`);
                    charIndex++;
                } else {
                    // 当前消息发送完成
                    res.write(`data: ${JSON.stringify({
                        code: 1,
                        type: 'message_end',
                        data: { title: currentMessage.title, content: '\n' },
                        timestamp: new Date().toISOString(),
                        progress: Math.round((messageIndex + 1) / messages.length * 100)
                    })}\n\n`);
                    messageIndex++;
                    isStreamingContent = false;
                }
            }
        }, 50); // 50ms间隔，模拟真实打字速度

        return;
    }

    // POST 流式数据接口
    if (url === '/stream' && req.method === 'POST') {
        console.log('开始POST流式传输...');
        
        // 读取POST数据
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            let requestData = {};
            try {
                requestData = JSON.parse(body);
            } catch (e) {
                requestData = { message: '解析请求数据失败' };
            }
            
            console.log('收到POST数据:', requestData);
            
            // 设置SSE响应头
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            // 基于POST数据生成响应内容
            const responseText = `您好！我收到了您的请求。您发送的消息是："${requestData.message || '无消息'}"，请求ID是：${requestData.id || 'unknown'}。

我现在开始为您处理这个请求。首先，我需要验证您的请求参数，确保所有必要的信息都已提供。

接下来，我会执行相应的业务逻辑，这可能包括数据查询、计算处理、结果生成等步骤。

请耐心等待，我会尽快为您提供完整的处理结果。整个过程可能需要一些时间，我会实时向您汇报进度。

处理完成后，我会将最终结果发送给您，并确保所有数据都准确无误。

感谢您的耐心等待！`;

            let charIndex = 0;
            
            // 处理客户端断开连接
            req.on('close', () => {
                console.log('POST客户端已断开连接');
                clearInterval(interval);
            });

            // 发送开始事件
            res.write(`data: ${JSON.stringify({
                code: 1,
                type: 'start',
                data: { title: '开始处理', content: '正在处理您的POST请求...' },
                timestamp: new Date().toISOString(),
                requestId: requestData.id || 'unknown'
            })}\n\n`);

            // 流式传输响应
            const interval = setInterval(() => {
                if (charIndex >= responseText.length) {
                    // 发送结束事件
                    res.write(`data: ${JSON.stringify({
                        code: 0,
                        type: 'end',
                        data: { title: '处理完成', content: '您的请求已处理完成！' },
                        timestamp: new Date().toISOString(),
                        requestId: requestData.id || 'unknown'
                    })}\n\n`);
                    res.end();
                    clearInterval(interval);
                    console.log('POST流式传输完成');
                    return;
                }

                const char = responseText[charIndex];
                res.write(`data: ${JSON.stringify({
                    code: 1,
                    type: 'content',
                    data: { title: '实时响应', content: char },
                    timestamp: new Date().toISOString(),
                    progress: Math.round((charIndex + 1) / responseText.length * 100),
                    requestId: requestData.id || 'unknown'
                })}\n\n`);
                charIndex++;
            }, 30); // 30ms间隔，稍快一些
        });

        return;
    }

    // 提供静态文件服务
    if (url === '/' || url === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // 404处理
    res.writeHead(404);
    res.end('Not Found');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`GET流式接口: http://localhost:${PORT}/stream`);
    console.log(`POST流式接口: http://localhost:${PORT}/stream`);
    console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
}); 