/**
 * 思灵社交App - 朋友圈模块（moments.js）自动化测试
 * 覆盖: 实例化、预设动态生成、时间格式化、点赞、评论、AI回复、边界条件
 */

const fs = require('fs');
const path = require('path');

// 通过Function构造器加载模块，模拟浏览器全局作用域
// moments.js 依赖 characters.js 中的 getCharacterById 函数
const charactersCode = fs.readFileSync(path.join(__dirname, '../js/characters.js'), 'utf8');
const momentsCode = fs.readFileSync(path.join(__dirname, '../js/moments.js'), 'utf8');

// 用 Function 包装执行，使变量成为全局变量
const loadModules = new Function(`
    ${charactersCode}
    ${momentsCode}
    return { MomentsEngine, momentsEngine, getCharacterById, AI_CHARACTERS };
`);

const { MomentsEngine, momentsEngine, getCharacterById, AI_CHARACTERS } = loadModules();

// 测试框架（与现有 test.js 保持一致风格）
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

// ========== MomentsEngine 实例化测试 ==========
section('📋 MomentsEngine 实例化测试');

assert(momentsEngine instanceof MomentsEngine, 'momentsEngine 是 MomentsEngine 的实例');
assert(Array.isArray(momentsEngine.moments), 'moments 属性为数组');
assert(typeof momentsEngine.comments === 'object', 'comments 属性为对象');
assert(typeof momentsEngine.userLikes === 'object', 'userLikes 属性为对象');
assert(momentsEngine.moments.length > 0, '初始化后 moments 不为空');

// 验证新创建的实例
const freshEngine = new MomentsEngine();
assert(freshEngine.moments.length > 0, '新实例初始化时自动生成预设动态');
assert(Object.keys(freshEngine.comments).length === 0, '新实例评论记录为空');
assert(Object.keys(freshEngine.userLikes).length === 0, '新实例点赞记录为空');

// ========== 预设动态生成测试 ==========
section('📝 预设动态生成测试');

const allMoments = momentsEngine.getAllMoments();
assert(allMoments.length === 15, '共有15条预设动态（5个角色各3条）');

// 验证每个角色都有动态
const characterIds = ['xiaowei', 'laowang', 'mengmeng', 'dashi', 'xiaohei'];
characterIds.forEach(charId => {
    const charMoments = allMoments.filter(m => m.characterId === charId);
    assert(charMoments.length === 3, `角色 ${charId} 有3条动态`);
});

// 验证动态结构完整性
allMoments.forEach((moment, idx) => {
    const hasAllFields = moment.id && moment.characterId && moment.content &&
                         moment.timestamp && typeof moment.likes === 'number' &&
                         moment.time && typeof moment.liked === 'boolean';
    assert(hasAllFields, `动态 ${moment.id} 结构完整（id/characterId/content/timestamp/likes/time/liked）`);
});

// 验证动态按时间倒序排列
let isSorted = true;
for (let i = 1; i < momentsEngine.moments.length; i++) {
    if (momentsEngine.moments[i].timestamp > momentsEngine.moments[i - 1].timestamp) {
        isSorted = false;
        break;
    }
}
assert(isSorted, '动态列表按时间倒序排列');

// 验证每条动态的 content 不为空
allMoments.forEach(m => {
    assert(m.content.length > 0, `动态 ${m.id} 内容不为空`);
});

// 验证 ID 唯一性
const idSet = new Set(allMoments.map(m => m.id));
assert(idSet.size === allMoments.length, '所有动态ID唯一');

// ========== 时间格式化测试 ==========
section('⏰ 时间格式化测试');

const engine = new MomentsEngine();
const now = Date.now();

// 刚刚 (< 1分钟)
const justNow = engine.formatMomentTime(now - 30000);
assert(justNow === '刚刚', '30秒前显示为"刚刚"');

const zeroSec = engine.formatMomentTime(now - 100);
assert(zeroSec === '刚刚', '0.1秒前显示为"刚刚"');

// X分钟前 (1分钟 ~ 1小时)
const fiveMin = engine.formatMomentTime(now - 5 * 60000);
assert(fiveMin === '5分钟前', '5分钟前格式正确');

const thirtyMin = engine.formatMomentTime(now - 30 * 60000);
assert(thirtyMin === '30分钟前', '30分钟前格式正确');

const fiftyNineMin = engine.formatMomentTime(now - 59 * 60000);
assert(fiftyNineMin === '59分钟前', '59分钟前格式正确');

// X小时前 (1小时 ~ 1天)
const oneHour = engine.formatMomentTime(now - 3600000);
assert(oneHour === '1小时前', '1小时前格式正确');

const tenHours = engine.formatMomentTime(now - 10 * 3600000);
assert(tenHours === '10小时前', '10小时前格式正确');

const twentyThreeHours = engine.formatMomentTime(now - 23 * 3600000);
assert(twentyThreeHours === '23小时前', '23小时前格式正确');

// 昨天 (1天 ~ 2天)
const yesterday = engine.formatMomentTime(now - 1.5 * 86400000);
assert(yesterday === '昨天', '1.5天前显示为"昨天"');

// 前天 (2天 ~ 3天)
const dayBeforeYesterday = engine.formatMomentTime(now - 2.5 * 86400000);
assert(dayBeforeYesterday === '前天', '2.5天前显示为"前天"');

// X月X日 (>= 3天)
const threeDaysAgo = engine.formatMomentTime(now - 3 * 86400000);
assert(threeDaysAgo.includes('月') && threeDaysAgo.includes('日'), '3天以上显示X月X日格式');

const longAgo = engine.formatMomentTime(now - 30 * 86400000);
assert(longAgo.includes('月') && longAgo.includes('日'), '30天前显示X月X日格式');

// 验证边界值：恰好1分钟
const exactOneMin = engine.formatMomentTime(now - 60000);
assert(exactOneMin === '1分钟前', '恰好1分钟显示为"1分钟前"');

// 验证边界值：恰好1小时
const exactOneHour = engine.formatMomentTime(now - 3600000);
assert(exactOneHour === '1小时前', '恰好1小时显示为"1小时前"');

// ========== 点赞功能测试 ==========
section('❤️ 点赞功能测试');

const likeEngine = new MomentsEngine();
const testMomentId = likeEngine.moments[0].id;
const initialLikes = likeEngine.moments[0].likes;

// 首次点赞
const likeResult = likeEngine.toggleLike(testMomentId);
assert(likeResult !== null, '点赞返回非null结果');
assert(likeResult.liked === true, '首次点赞后liked为true');
assert(likeResult.likes === initialLikes + 1, '点赞后数量加1');

// 再次点赞（取消点赞）
const unlikeResult = likeEngine.toggleLike(testMomentId);
assert(unlikeResult.liked === false, '再次点赞后liked为false（取消点赞）');
assert(unlikeResult.likes === initialLikes, '取消点赞后数量恢复');

// 连续点赞/取消
likeEngine.toggleLike(testMomentId); // 点赞
likeEngine.toggleLike(testMomentId); // 取消
likeEngine.toggleLike(testMomentId); // 再次点赞
const finalResult = likeEngine.toggleLike(testMomentId); // 最后取消
assert(finalResult.likes === initialLikes, '多次切换后点赞数正确恢复');

// 对不同动态分别点赞
const secondMomentId = likeEngine.moments[1].id;
const secondInitialLikes = likeEngine.moments[1].likes;
likeEngine.toggleLike(testMomentId);
likeEngine.toggleLike(secondMomentId);
assert(likeEngine.userLikes[testMomentId] === true, '第一条动态点赞状态独立');
assert(likeEngine.userLikes[secondMomentId] === true, '第二条动态点赞状态独立');
assert(likeEngine.moments[1].likes === secondInitialLikes + 1, '第二条动态点赞数独立计算');

// getAllMoments 中 liked 字段反映点赞状态
const momentsWithLike = likeEngine.getAllMoments();
const likedMoment = momentsWithLike.find(m => m.id === testMomentId);
assert(likedMoment.liked === true, 'getAllMoments 中 liked 字段正确反映点赞状态');

// 对不存在的动态点赞
const nullLikeResult = likeEngine.toggleLike('nonexistent_moment');
assert(nullLikeResult === null, '对不存在的动态点赞返回null');

// ========== 评论功能测试 ==========
section('💬 评论功能测试');

const commentEngine = new MomentsEngine();
const commentMomentId = commentEngine.moments[0].id;

// 添加评论
const comment = commentEngine.addComment(commentMomentId, '写得真好！');
assert(comment !== null, '添加评论返回非null');
assert(comment.author === '我', '评论作者为"我"');
assert(comment.content === '写得真好！', '评论内容正确');
assert(comment.id.startsWith('comment_'), '评论ID以comment_开头');
assert(typeof comment.time === 'string' && comment.time.length > 0, '评论时间不为空');

// 评论被存储在comments对象中
assert(commentEngine.comments[commentMomentId].length >= 1, '评论被存储到comments中');

// 添加多条评论
commentEngine.addComment(commentMomentId, '第二条评论');
commentEngine.addComment(commentMomentId, '第三条评论');
assert(commentEngine.comments[commentMomentId].length >= 3, '多条评论可以累积');

// 评论ID唯一性
const commentIds = commentEngine.comments[commentMomentId].map(c => c.id);
const commentIdSet = new Set(commentIds);
assert(commentIdSet.size === commentIds.length, '评论ID彼此唯一');

// getAllMoments 包含评论列表
const momentsWithComments = commentEngine.getAllMoments();
const commentedMoment = momentsWithComments.find(m => m.id === commentMomentId);
assert(commentedMoment.commentList.length >= 3, 'getAllMoments 中 commentList 包含评论');

// getMomentById 包含评论
const detailMoment = commentEngine.getMomentById(commentMomentId);
assert(detailMoment !== null, 'getMomentById 返回动态详情');
assert(detailMoment.commentList.length >= 3, 'getMomentById 包含评论列表');

// 评论内容自动去除首尾空格
const trimComment = commentEngine.addComment(commentMomentId, '  有空格的评论  ');
assert(trimComment.content === '有空格的评论', '评论内容自动trim');

// ========== AI回复生成测试 ==========
section('🤖 AI回复生成测试');

const aiEngine = new MomentsEngine();
const aiMomentId = aiEngine.moments[0].id;
const aiCharId = aiEngine.moments[0].characterId;

// 添加评论后检查AI回复预设是否可用
const replies = aiEngine.getCommentReplies(aiCharId);
assert(Array.isArray(replies), 'getCommentReplies 返回数组');
assert(replies.length > 0, '回复预设不为空');

// 验证所有5个角色都有回复预设
characterIds.forEach(charId => {
    const charReplies = aiEngine.getCommentReplies(charId);
    assert(charReplies.length >= 5, `角色 ${charId} 至少有5条回复预设`);
});

// 未知角色返回默认回复
const unknownReplies = aiEngine.getCommentReplies('unknown_char');
assert(unknownReplies.length > 0, '未知角色有默认回复');
assert(unknownReplies[0] === '谢谢评论～', '未知角色默认回复内容正确');

// AI回复具有多样性（多次获取回复，应该不止一种）
const replySet = new Set();
for (let i = 0; i < 50; i++) {
    const r = replies[Math.floor(Math.random() * replies.length)];
    replySet.add(r);
}
assert(replySet.size > 1, 'AI回复具有多样性');

// generateAIReply 被addComment自动调用（需要等待setTimeout）
// 由于setTimeout是异步的，这里验证函数不抛错即可
let noError = true;
try {
    aiEngine.generateAIReply(aiMomentId, '测试评论');
} catch (e) {
    noError = false;
}
assert(noError, 'generateAIReply 对有效动态不抛出异常');

// generateAIReply 对不存在的动态不抛错
noError = true;
try {
    aiEngine.generateAIReply('nonexistent_id', '测试');
} catch (e) {
    noError = false;
}
assert(noError, 'generateAIReply 对不存在的动态不抛出异常');

// ========== 边界条件测试 ==========
section('🔒 边界条件测试');

const edgeEngine = new MomentsEngine();

// 空输入评论
const emptyComment = edgeEngine.addComment(edgeEngine.moments[0].id, '');
assert(emptyComment === null, '空字符串评论返回null');

const whitespaceComment = edgeEngine.addComment(edgeEngine.moments[0].id, '   ');
assert(whitespaceComment === null, '纯空格评论返回null');

const nullComment = edgeEngine.addComment(edgeEngine.moments[0].id, null);
assert(nullComment === null, 'null内容评论返回null');

const undefinedComment = edgeEngine.addComment(edgeEngine.moments[0].id, undefined);
assert(undefinedComment === null, 'undefined内容评论返回null');

// 不存在的动态ID
const noMomentComment = edgeEngine.addComment('fake_id', '评论');
assert(noMomentComment === null, '对不存在的动态评论返回null');

const noMomentLike = edgeEngine.toggleLike('fake_id');
assert(noMomentLike === null, '对不存在的动态点赞返回null');

const noMomentDetail = edgeEngine.getMomentById('fake_id');
assert(noMomentDetail === null, 'getMomentById 查找不存在的ID返回null');

// 特殊字符评论
const specialComment = edgeEngine.addComment(edgeEngine.moments[0].id, '<script>alert("xss")</script>');
assert(specialComment !== null, '特殊字符评论能正常添加');
assert(specialComment.content === '<script>alert("xss")</script>', '特殊字符评论内容完整保存');

// 长评论
const longContent = '测'.repeat(1000);
const longComment = edgeEngine.addComment(edgeEngine.moments[0].id, longContent);
assert(longComment !== null, '长评论能正常添加');
assert(longComment.content === longContent, '长评论内容完整保存');

// 验证getMomentById返回的结构完整性
const validMoment = edgeEngine.getMomentById(edgeEngine.moments[0].id);
assert(validMoment.id !== undefined, 'getMomentById 返回的对象有id');
assert(validMoment.characterId !== undefined, 'getMomentById 返回的对象有characterId');
assert(validMoment.content !== undefined, 'getMomentById 返回的对象有content');
assert(validMoment.time !== undefined, 'getMomentById 返回的对象有time');
assert(typeof validMoment.liked === 'boolean', 'getMomentById 返回的对象有liked布尔值');
assert(Array.isArray(validMoment.commentList), 'getMomentById 返回的对象有commentList数组');

// 多次初始化不会累积数据
const reinitEngine = new MomentsEngine();
const countBefore = reinitEngine.moments.length;
reinitEngine.init();
assert(reinitEngine.moments.length === countBefore, '重新init不会累积动态数据');

// ========== 测试汇总 ==========
section('📊 朋友圈模块测试结果汇总');

const total = passed + failed;
console.log(`\n  总计: ${total} 个测试`);
console.log(`  通过: ${passed} ✅`);
console.log(`  失败: ${failed} ${failed > 0 ? '❌' : '✅'}`);

if (failed > 0) {
    console.log('\n  失败的测试:');
    errors.forEach(e => console.log(`    - ${e}`));
    process.exit(1);
} else {
    console.log('\n  🎉 朋友圈模块全部测试通过！');
    process.exit(0);
}
