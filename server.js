const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // 设置完整的CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24小时

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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Credentials': 'true'
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
        
        // 声明interval变量用于清理
        let interval = null;
        
        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Credentials': 'true'
        });
        
        // 处理客户端断开连接
        req.on('close', () => {
            console.log('POST客户端已断开连接');
            if (interval) {
                clearInterval(interval);
            }
        });

        req.on('aborted', () => {
            console.log('POST请求被中止');
            if (interval) {
                clearInterval(interval);
            }
        });
        
        // 读取POST数据
        let body = '';
        req.on('data', chunk => {
            console.log('收到数据块:', chunk.toString());
            body += chunk.toString();
        });
        
        req.on('end', () => {
            console.log('POST数据接收完成, body:', body);
            let requestData = {};
            try {
                requestData = JSON.parse(body);
            } catch (e) {
                console.log('解析JSON失败:', e.message);
                requestData = { message: '解析请求数据失败' };
            }
            
            console.log('收到POST数据:', requestData);

            // 基于POST数据生成响应内容
            const responseText = `您好！我收到了您的请求。您发送的消息是："${requestData.message || '无消息'}"，请求ID是：${requestData.id || 'unknown'}。

我现在开始为您处理这个请求。首先，我需要验证您的请求参数，确保所有必要的信息都已提供。

接下来，我会执行相应的业务逻辑，这可能包括数据查询、计算处理、结果生成等步骤。

请耐心等待，我会尽快为您提供完整的处理结果。整个过程可能需要一些时间，我会实时向您汇报进度。

处理完成后，我会将最终结果发送给您，并确保所有数据都准确无误。

感谢您的耐心等待！`;

            let charIndex = 0;

            // 发送开始事件
            res.write(`data: ${JSON.stringify({
                code: 1,
                type: 'start',
                data: { title: '开始处理', content: '正在处理您的POST请求...' },
                timestamp: new Date().toISOString(),
                requestId: requestData.id || 'unknown'
            })}\n\n`);

            console.log('开始事件已发送，准备启动流式传输...');

            // 立即启动流式传输，使用setTimeout来确保异步执行
            setTimeout(() => {
                console.log('开始流式传输定时器...');
                
                // 流式传输响应
                interval = setInterval(() => {
                    console.log('流式传输tick, charIndex:', charIndex, 'total:', responseText.length);
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
            }, 100); // 100ms后开始流式传输
        });

        return;
    }

    // 医疗聊天记录总结接口
    if (url === '/summary' && req.method === 'GET') {
        console.log('开始医疗聊天记录总结流式传输...');
        
        // 声明interval变量用于清理
        let interval = null;
        
        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Credentials': 'true'
        });
        
        // 处理客户端断开连接
        req.on('close', () => {
            console.log('医疗总结客户端已断开连接');
            if (interval) {
                clearInterval(interval);
            }
        });

        req.on('aborted', () => {
            console.log('医疗总结请求被中止');
            if (interval) {
                clearInterval(interval);
            }
        });
        
        // 生成当前时间
        const now = new Date();
        const dateStr = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 发送标题消息
        res.write(`data: ${JSON.stringify({
            code: 1,
            data: {
                messageType: 1,
                title: `根据当前订单${dateStr}开始的7条聊天记录，生成总结如下`
            },
            message: "操作成功"
        })}\n\n`);
        
        // 医疗总结的长文本内容
        const medicalContent = `患者主诉头疼、胸闷、头晕，询问治疗方案及医院地址。

【病情分析】
根据患者描述的症状，头疼、胸闷、头晕这三种症状可能与多种疾病相关，需要进行详细的问诊和体格检查来明确诊断。

常见可能的疾病包括：
1. 高血压：头疼、头晕是高血压的常见症状，胸闷也可能与血压升高有关
2. 心脏疾病：胸闷可能提示心脏功能异常，如心律不齐、心肌缺血等
3. 血管疾病：脑血管疾病可能导致头疼、头晕症状
4. 神经性头疼：紧张性头疼、偏头疼等也会引起头疼症状
5. 焦虑或抑郁：心理因素也可能导致这些躯体症状

【建议检查项目】
1. 血压测量：了解血压情况
2. 心电图检查：评估心脏电生理活动
3. 血常规检查：排除贫血等血液疾病
4. 生化检查：包括血糖、血脂、肝肾功能等
5. 头颅CT或MRI：必要时进行头部影像学检查
6. 心脏彩超：评估心脏结构和功能

【治疗建议】
1. 生活方式调整：
   - 保持规律作息，避免熬夜
   - 适当运动，如散步、太极等
   - 饮食清淡，减少盐分摄入
   - 戒烟限酒
   - 保持心情愉快，避免过度紧张

2. 药物治疗：
   - 如确诊高血压，需要规范的降压治疗
   - 头疼症状明显时，可考虑使用镇痛药物
   - 心脏疾病需要专科医生指导用药

3. 定期复查：
   - 血压监测：每日测量血压
   - 定期体检：半年至一年复查相关指标
   - 症状变化时及时就医

【推荐医院】
1. 三甲综合医院：
   - 北京协和医院
   - 北京大学第一医院
   - 清华大学附属北京清华长庚医院
   - 中日友好医院

2. 专科医院：
   - 首都医科大学附属北京安贞医院（心血管专科）
   - 北京天坛医院（神经内科）

【联系方式及地址】
北京协和医院：
地址：北京市东城区东单帅府园1号
电话：010-69156114
挂号：可通过北京协和医院官方APP或现场挂号

【注意事项】
1. 如症状加重或出现新的不适，应立即就医
2. 遵医嘱用药，不要自行停药或更改剂量
3. 保持良好的心态，避免过度焦虑
4. 如有疑问，可随时联系医生进行咨询

【预后评估】
大多数情况下，通过规范的诊断和治疗，患者的症状可以得到有效缓解。关键是要早发现、早诊断、早治疗，同时配合良好的生活方式调整。

【随访安排】
建议患者在治疗开始后1-2周内复诊，评估治疗效果，必要时调整治疗方案。长期随访对于慢性疾病的管理非常重要。

希望以上建议对患者有所帮助，如有任何疑问，请及时与医生联系。`;

        let charIndex = 0;
        
        // 使用setTimeout确保异步执行
        setTimeout(() => {
            console.log('开始医疗总结流式传输...');
            
            // 流式传输响应
            interval = setInterval(() => {
                if (charIndex >= medicalContent.length) {
                    // 发送最后一条空内容消息
                    res.write(`data: ${JSON.stringify({
                        code: 1,
                        data: {
                            content: "",
                            messageType: 1
                        },
                        message: "操作成功"
                    })}\n\n`);
                    
                    res.end();
                    clearInterval(interval);
                    console.log('医疗总结流式传输完成');
                    return;
                }

                const char = medicalContent[charIndex];
                res.write(`data: ${JSON.stringify({
                    code: 1,
                    data: {
                        content: char,
                        messageType: 1
                    },
                    message: "操作成功"
                })}\n\n`);
                
                charIndex++;
            }, 20); // 20ms间隔，较快的传输速度
        }, 100);

        return;
    }

    // POST 医疗聊天记录总结接口
    if (url === '/summary' && req.method === 'POST') {
        console.log('开始POST医疗聊天记录总结流式传输...');
        
        // 声明interval变量用于清理
        let interval = null;
        
        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Credentials': 'true'
        });
        
        // 处理客户端断开连接
        req.on('close', () => {
            console.log('POST医疗总结客户端已断开连接');
            if (interval) {
                clearInterval(interval);
            }
        });

        req.on('aborted', () => {
            console.log('POST医疗总结请求被中止');
            if (interval) {
                clearInterval(interval);
            }
        });
        
        // 生成当前时间
        const now = new Date();
        const dateStr = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 发送标题消息
        res.write(`data: ${JSON.stringify({
            code: 1,
            data: {
                messageType: 1,
                title: `根据当前订单${dateStr}开始的7条聊天记录，生成总结如下`
            },
            message: "操作成功"
        })}\n\n`);
        
        // 固定的医疗总结内容
        const postContent = `患者主诉头疼、胸闷、头晕，询问治疗方案及医院地址。

【病情概述】
患者因头疼、胸闷、头晕等症状前来咨询，症状持续时间较长，影响日常生活质量。患者希望了解可能的病因、治疗方案以及推荐的医疗机构。

【症状分析】
1. 头疼：可能与血管性头疼、紧张性头疼或继发性头疼相关
2. 胸闷：需要考虑心脏疾病、肺部疾病或焦虑症状
3. 头晕：可能与血压异常、内耳疾病或脑血管疾病有关

【可能的诊断】
根据症状描述，可能的疾病包括：
- 高血压及其并发症
- 心血管疾病（如心律不齐、冠心病）
- 神经血管性头疼
- 焦虑抑郁状态
- 脑血管疾病早期表现
- 颈椎病引起的头晕头疼

【建议检查】
1. 基础检查：血压监测、心电图、血常规、生化检查
2. 影像学检查：心脏彩超、头颅CT/MRI、颈椎X线
3. 专科检查：神经内科、心内科专科检查

【治疗建议】
1. 生活方式调整：
   - 规律作息，避免熬夜
   - 适量运动，如散步、太极
   - 清淡饮食，控制盐分摄入
   - 戒烟限酒，保持心情愉快

2. 药物治疗：
   - 根据具体诊断选择合适药物
   - 血压异常时需要降压治疗
   - 头疼严重时可使用镇痛药物
   - 心脏疾病需要专科医生指导

3. 定期随访：
   - 监测血压变化
   - 定期复查相关指标
   - 症状变化时及时就医

【推荐医院】
1. 三甲综合医院：
   - 北京协和医院（内科）
   - 北京大学第一医院（心内科、神经内科）
   - 清华大学附属北京清华长庚医院
   - 中日友好医院

2. 专科医院：
   - 首都医科大学附属北京安贞医院（心血管专科）
   - 北京天坛医院（神经内科）
   - 宣武医院（神经内科）

【就诊建议】
1. 就诊前准备：
   - 记录症状发生时间、频率、诱因
   - 携带既往病历和检查结果
   - 准备医保卡、身份证
   - 列出正在服用的药物清单

2. 就诊流程：
   - 建议先挂普通内科或心内科
   - 详细描述症状给医生
   - 配合完成各项检查
   - 根据检查结果制定治疗方案

【注意事项】
1. 如症状突然加重或出现新症状，应立即就医
2. 严格遵医嘱用药，不要自行停药或更改剂量
3. 保持良好心态，避免过度焦虑
4. 定期监测血压，记录变化
5. 如有疑问，及时与医生沟通

【联系方式】
北京协和医院：
- 地址：北京市东城区东单帅府园1号
- 电话：010-69156114
- 挂号：可通过医院官方APP或现场挂号

【预后评估】
大多数情况下，通过规范的诊断和治疗，患者的症状可以得到有效控制。关键在于：
- 早期诊断，及时治疗
- 良好的治疗依从性
- 健康的生活方式
- 定期随访和监测

【总结】
患者的症状需要引起重视，建议尽快到正规医院就诊，通过详细的检查明确诊断。同时要注意生活方式的调整，保持良好的心态，积极配合治疗。

如有任何疑问或症状变化，请及时与医生联系。我们将为您提供持续的医疗支持和指导。

祝您早日康复！`;

        let charIndex = 0;
        
        // 使用setTimeout确保异步执行
        setTimeout(() => {
            console.log('开始POST医疗总结流式传输...');
            
            // 流式传输响应
            interval = setInterval(() => {
                if (charIndex >= postContent.length) {
                    // 发送最后一条空内容消息
                    res.write(`data: ${JSON.stringify({
                        code: 1,
                        data: {
                            content: "",
                            messageType: 1
                        },
                        message: "操作成功"
                    })}\n\n`);
                    
                    res.end();
                    clearInterval(interval);
                    console.log('POST医疗总结流式传输完成');
                    return;
                }

                const char = postContent[charIndex];
                res.write(`data: ${JSON.stringify({
                    code: 1,
                    data: {
                        content: char,
                        messageType: 1
                    },
                    message: "操作成功"
                })}\n\n`);
                
                charIndex++;
            }, 20); // 20ms间隔，较快的传输速度
        }, 100);

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
    console.log(`GET医疗总结接口: http://localhost:${PORT}/summary`);
    console.log(`POST医疗总结接口: http://localhost:${PORT}/summary`);
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