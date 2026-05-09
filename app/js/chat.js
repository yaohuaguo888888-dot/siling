/**
 * 聊天引擎模块
 * 负责消息处理、情感分析和AI回复生成
 */

class ChatEngine {
    constructor() {
        // 每个角色的聊天历史 { characterId: [messages] }
        this.chatHistories = {};
        // 情感关键词库
        this.sentimentKeywords = {
            happy: ['开心', '高兴', '太好了', '哈哈', '棒', '赞', '喜欢', '爱', '幸福', '成功', '厉害', '优秀', '好消息', '恭喜', '耶'],
            sad: ['难过', '伤心', '不开心', '烦', '累', '郁闷', '失望', '痛苦', '孤独', '无聊', '讨厌', '害怕', '焦虑', '压力', '崩溃', '丧'],
            question: ['吗', '呢', '？', '?', '怎么', '为什么', '如何', '什么', '哪', '谁', '多少', '是否', '能不能', '可以吗', '建议']
        };
    }

    /**
     * 分析消息情感倾向
     * @param {string} message - 用户消息
     * @returns {string} 情感类型: happy/sad/question/general
     */
    analyzeSentiment(message) {
        const text = message.toLowerCase();

        // 计算各情感的匹配度
        const scores = {
            happy: 0,
            sad: 0,
            question: 0
        };

        for (const [sentiment, keywords] of Object.entries(this.sentimentKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    scores[sentiment]++;
                }
            }
        }

        // 找出得分最高的情感
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) return 'general';

        return Object.keys(scores).find(key => scores[key] === maxScore);
    }

    /**
     * 生成AI回复
     * @param {string} characterId - 角色ID
     * @param {string} userMessage - 用户消息
     * @returns {string} AI回复内容
     */
    generateResponse(characterId, userMessage) {
        const character = getCharacterById(characterId);
        if (!character) return '...';

        const sentiment = this.analyzeSentiment(userMessage);
        const responses = character.responses[sentiment];

        // 随机选择一条回复，避免连续重复
        const lastResponse = this.getLastAIMessage(characterId);
        let response;
        let attempts = 0;

        do {
            response = responses[Math.floor(Math.random() * responses.length)];
            attempts++;
        } while (response === lastResponse && attempts < 5 && responses.length > 1);

        return response;
    }

    /**
     * 获取角色的最后一条AI消息
     * @param {string} characterId - 角色ID
     * @returns {string|null} 最后一条消息内容
     */
    getLastAIMessage(characterId) {
        const history = this.chatHistories[characterId];
        if (!history || history.length === 0) return null;

        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].type === 'ai') {
                return history[i].content;
            }
        }
        return null;
    }

    /**
     * 发送消息并获取回复
     * @param {string} characterId - 角色ID
     * @param {string} message - 用户消息
     * @returns {Object} { userMsg, aiMsg } 包含时间戳的消息对象
     */
    sendMessage(characterId, message) {
        if (!this.chatHistories[characterId]) {
            this.chatHistories[characterId] = [];
        }

        const now = new Date();
        const timeStr = this.formatTime(now);

        // 用户消息
        const userMsg = {
            id: this.generateId(),
            type: 'user',
            content: message,
            time: timeStr,
            timestamp: now.getTime()
        };
        this.chatHistories[characterId].push(userMsg);

        // AI回复
        const aiResponse = this.generateResponse(characterId, message);
        const aiMsg = {
            id: this.generateId(),
            type: 'ai',
            content: aiResponse,
            time: timeStr,
            timestamp: now.getTime() + 1000
        };
        this.chatHistories[characterId].push(aiMsg);

        return { userMsg, aiMsg };
    }

    /**
     * 获取角色的打招呼消息
     * @param {string} characterId - 角色ID
     * @returns {Object} 打招呼消息对象
     */
    getGreeting(characterId) {
        const character = getCharacterById(characterId);
        if (!character) return null;

        const greeting = character.greetings[Math.floor(Math.random() * character.greetings.length)];
        return {
            id: this.generateId(),
            type: 'ai',
            content: greeting,
            time: this.formatTime(new Date()),
            timestamp: Date.now()
        };
    }

    /**
     * 获取聊天历史
     * @param {string} characterId - 角色ID
     * @returns {Array} 消息数组
     */
    getHistory(characterId) {
        return this.chatHistories[characterId] || [];
    }

    /**
     * 格式化时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的时间字符串
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一标识符
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 获取最后一条消息预览（用于联系人列表）
     * @param {string} characterId - 角色ID
     * @returns {Object|null} { content, time }
     */
    getLastMessagePreview(characterId) {
        const history = this.chatHistories[characterId];
        if (!history || history.length === 0) return null;

        const lastMsg = history[history.length - 1];
        return {
            content: lastMsg.content.length > 20
                ? lastMsg.content.substring(0, 20) + '...'
                : lastMsg.content,
            time: lastMsg.time
        };
    }
}

// 创建全局聊天引擎实例
const chatEngine = new ChatEngine();
