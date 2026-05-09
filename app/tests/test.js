/**
 * 思灵社交App - Node.js 命令行测试
 * 测试核心逻辑模块（characters.js + chat.js）
 */

const fs = require('fs');
const path = require('path');

// 通过Function构造器加载模块，模拟浏览器全局作用域
const charactersCode = fs.readFileSync(path.join(__dirname, '../js/characters.js'), 'utf8');
const chatCode = fs.readFileSync(path.join(__dirname, '../js/chat.js'), 'utf8');

// 用 Function 包装执行，使变量成为全局变量
const loadModules = new Function(`
    ${charactersCode}
    ${chatCode}
    return { AI_CHARACTERS, getCharacterById, getAllCharacters, ChatEngine, chatEngine };
`);

const { AI_CHARACTERS, getCharacterById, getAllCharacters, ChatEngine, chatEngine } = loadModules();

// 测试框架
let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, description) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${description}`);
    } else {
        failed++;
        console.log(`  ❌ ${description}`);
        errors.push(description);
    }
}

function section(title) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(50));
}

// ========== 角色模块测试 ==========
section('📋 角色模块测试');

assert(AI_CHARACTERS.length === 5, '应有5个AI角色');
assert(typeof getCharacterById === 'function', 'getCharacterById函数存在');
assert(typeof getAllCharacters === 'function', 'getAllCharacters函数存在');

const xiaowei = getCharacterById('xiaowei');
assert(xiaowei !== undefined, '能通过ID找到小薇');
assert(xiaowei.name === '小薇', '小薇的名字正确');
assert(xiaowei.personality === '温柔体贴', '小薇的性格正确');
assert(Array.isArray(xiaowei.greetings), '小薇有打招呼语');
assert(xiaowei.greetings.length > 0, '打招呼语不为空');

const allChars = getAllCharacters();
assert(allChars.length === 5, 'getAllCharacters返回全部角色');

const nonExist = getCharacterById('nobody');
assert(nonExist === undefined, '查找不存在的角色返回undefined');

// 验证所有角色结构完整
AI_CHARACTERS.forEach(char => {
    assert(char.id && char.name && char.avatar && char.responses, `角色 ${char.name} 结构完整`);
    assert(
        char.responses.happy && char.responses.sad && char.responses.question && char.responses.general,
        `角色 ${char.name} 有全部情感回复`
    );
});

// ========== 聊天引擎测试 ==========
section('💬 聊天引擎测试');

assert(chatEngine instanceof ChatEngine, 'chatEngine实例存在');

// 情感分析测试
assert(chatEngine.analyzeSentiment('我今天好开心啊') === 'happy', '识别开心情感');
assert(chatEngine.analyzeSentiment('好难过想哭') === 'sad', '识别悲伤情感');
assert(chatEngine.analyzeSentiment('你觉得怎么样呢？') === 'question', '识别提问');
assert(chatEngine.analyzeSentiment('今天天气不错') === 'general', '识别一般消息');
assert(chatEngine.analyzeSentiment('我太高兴了哈哈哈') === 'happy', '多关键词强化识别');

// 消息发送测试
const result = chatEngine.sendMessage('xiaowei', '你好呀');
assert(result.userMsg !== undefined, '发送消息返回用户消息');
assert(result.aiMsg !== undefined, '发送消息返回AI回复');
assert(result.userMsg.type === 'user', '用户消息类型正确');
assert(result.aiMsg.type === 'ai', 'AI消息类型正确');
assert(result.userMsg.content === '你好呀', '用户消息内容正确');
assert(result.aiMsg.content.length > 0, 'AI回复不为空');

// 聊天历史测试
const history = chatEngine.getHistory('xiaowei');
assert(history.length >= 2, '聊天历史记录正确');

// 打招呼测试
const greeting = chatEngine.getGreeting('laowang');
assert(greeting !== null, '能获取打招呼消息');
assert(greeting.type === 'ai', '打招呼消息类型正确');
assert(greeting.content.length > 0, '打招呼内容不为空');

// 消息预览测试
const preview = chatEngine.getLastMessagePreview('xiaowei');
assert(preview !== null, '能获取最后消息预览');
assert(preview.content.length > 0, '预览内容不为空');
assert(preview.time.length > 0, '预览时间不为空');

// 回复多样性测试
const responses = new Set();
for (let i = 0; i < 20; i++) {
    const r = chatEngine.generateResponse('xiaohei', '你好');
    responses.add(r);
}
assert(responses.size > 1, 'AI回复具有多样性');

// ID生成唯一性测试
const ids = new Set();
for (let i = 0; i < 100; i++) {
    ids.add(chatEngine.generateId());
}
assert(ids.size === 100, '生成的ID具有唯一性');

// 时间格式测试
const timeStr = chatEngine.formatTime(new Date(2024, 0, 1, 9, 5));
assert(timeStr === '09:05', '时间格式化正确');

// ========== 边界条件测试 ==========
section('🔒 边界条件测试');

assert(chatEngine.generateResponse('nonexist', 'hello') === '...', '不存在角色返回默认回复');
assert(chatEngine.getGreeting('nonexist') === null, '不存在角色打招呼返回null');
assert(chatEngine.getHistory('newchar').length === 0, '新角色历史为空数组');
assert(chatEngine.getLastMessagePreview('newchar') === null, '新角色预览为null');

// 空消息情感分析
assert(chatEngine.analyzeSentiment('') === 'general', '空消息返回general');

// 长消息处理
const longMsg = '哈'.repeat(1000);
const longResult = chatEngine.sendMessage('mengmeng', longMsg);
assert(longResult.userMsg.content === longMsg, '长消息能正确存储');

// 特殊字符处理
const specialMsg = '<script>alert("xss")</script>';
const specialResult = chatEngine.sendMessage('dashi', specialMsg);
assert(specialResult.userMsg.content === specialMsg, '特殊字符能正确存储');

// ========== 测试汇总 ==========
section('📊 测试结果汇总');

const total = passed + failed;
console.log(`\n  总计: ${total} 个测试`);
console.log(`  通过: ${passed} ✅`);
console.log(`  失败: ${failed} ${failed > 0 ? '❌' : '✅'}`);

if (failed > 0) {
    console.log('\n  失败的测试:');
    errors.forEach(e => console.log(`    - ${e}`));
    process.exit(1);
} else {
    console.log('\n  🎉 全部测试通过！');
    process.exit(0);
}
