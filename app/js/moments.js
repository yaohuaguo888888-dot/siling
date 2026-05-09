/**
 * 朋友圈模块
 * 负责朋友圈动态数据管理、点赞和评论功能
 */

class MomentsEngine {
    constructor() {
        // 朋友圈动态列表
        this.moments = [];
        // 用户评论记录 { momentId: [comments] }
        this.comments = {};
        // 用户点赞记录 { momentId: true/false }
        this.userLikes = {};
        // 待处理的AI回复定时器（用于清理悬挂timer）
        this.pendingTimers = [];

        this.init();
    }

    /**
     * 初始化朋友圈数据
     * 为每个AI角色生成预设的朋友圈动态
     */
    init() {
        this.moments = this.generatePresetMoments();
        // 按时间倒序排列
        this.moments.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * 生成预设的朋友圈动态
     * @returns {Array} 动态数组
     */
    generatePresetMoments() {
        const now = Date.now();
        const HOUR = 3600000;
        const DAY = 86400000;

        const presets = [
            // 小薇的动态
            {
                characterId: 'xiaowei',
                content: '今天阳光好好呀～泡了一杯花茶，坐在窗边看了一下午的书。生活偶尔慢下来，才能听见内心的声音。希望看到这条的你，今天也被温柔以待 ❤️',
                timeOffset: 2 * HOUR,
                likes: 15
            },
            {
                characterId: 'xiaowei',
                content: '分享一个小小的感悟：与其等待别人理解你，不如先学会理解自己。每个人都在自己的时区里成长，不必着急，不必比较。你已经很棒了～',
                timeOffset: 1 * DAY + 5 * HOUR,
                likes: 23
            },
            {
                characterId: 'xiaowei',
                content: '晚安呀，世界。今天又是被大家治愈的一天。谢谢每一个愿意跟我分享心事的朋友，你们的信任是我最大的幸福 🌙',
                timeOffset: 2 * DAY + 8 * HOUR,
                likes: 31
            },
            // 老王的动态
            {
                characterId: 'laowang',
                content: '今天看了一篇关于量子纠缠的最新论文，越来越觉得微观世界的规则颠覆了我们的直觉认知。物理学的美妙之处就在于，当你以为自己理解了一切的时候，宇宙会告诉你：你还差得远呢。',
                timeOffset: 3 * HOUR,
                likes: 8
            },
            {
                characterId: 'laowang',
                content: '推荐一个思维模型：第一性原理。遇到复杂问题时，把它拆解到最基本的事实和假设，然后从零开始推理。比盲目参考别人的方案要有效得多。',
                timeOffset: 1 * DAY + 2 * HOUR,
                likes: 19
            },
            {
                characterId: 'laowang',
                content: '周末把家里的路由器固件刷了一下，网速提升了30%。技术改变生活，这话真没错。有兴趣的朋友可以来问我怎么操作。',
                timeOffset: 2 * DAY + 3 * HOUR,
                likes: 12
            },
            // 萌萌的动态
            {
                characterId: 'mengmeng',
                content: '啊啊啊啊！！！新番第三集太好看了吧！！！(ﾉ≧∀≦)ﾉ 男主终于觉醒了！！战斗场景做得也太绝了！！有没有人一起追番的！！冲冲冲！！！',
                timeOffset: 1 * HOUR,
                likes: 27
            },
            {
                characterId: 'mengmeng',
                content: '今天cosplay了最喜欢的角色去漫展！好多人找萌萌合照嘿嘿～ 开心得原地转了三圈！下次还要去！✨✨✨ #漫展日常 #cos日记',
                timeOffset: 1 * DAY + 6 * HOUR,
                likes: 45
            },
            {
                characterId: 'mengmeng',
                content: '刚画完一幅同人图！画了六个小时手都抖了但是超级满意 (≧◡≦) 感觉自己的画技又进步了一点点！继续加油！每天都要进步一点点！',
                timeOffset: 2 * DAY + 1 * HOUR,
                likes: 33
            },
            // 大师的动态
            {
                characterId: 'dashi',
                content: '晨起饮茶，观院中老松。其根深扎裂石之中，枝却向天空舒展自如。人生亦当如此——扎根要深，心胸要阔。',
                timeOffset: 5 * HOUR,
                likes: 18
            },
            {
                characterId: 'dashi',
                content: '今日读到一句话甚好：「不是风动，不是幡动，仁者心动。」世间种种纷扰，不过是心之投射。心若止水，万物自明。与诸君共勉。',
                timeOffset: 1 * DAY + 9 * HOUR,
                likes: 26
            },
            {
                characterId: 'dashi',
                content: '一位施主问我：「大师，如何才能不再焦虑？」我答：「你先放下手中的手机。」他笑了，我也笑了。知易行难，但知已是行的开始。',
                timeOffset: 2 * DAY + 6 * HOUR,
                likes: 42
            },
            // 小黑的动态
            {
                characterId: 'xiaohei',
                content: '刚才看到一个人发朋友圈：「今天又是努力的一天。」配图是他在星巴克对着电脑发呆的自拍。兄弟，你那叫摸鱼不叫努力 😂😂😂',
                timeOffset: 4 * HOUR,
                likes: 56
            },
            {
                characterId: 'xiaohei',
                content: '人生建议：永远不要在饿的时候逛超市，不要在深夜做任何决定，不要在生气的时候发消息。我刚犯了这三条。钱包在哭泣。',
                timeOffset: 1 * DAY + 4 * HOUR,
                likes: 38
            },
            {
                characterId: 'xiaohei',
                content: '连续加班第五天，老板说「年轻人要多锻炼」。好的，我现在锻炼的是忍耐力。不过说真的，项目做完还是挺有成就感的...虽然我死都不会当面承认。',
                timeOffset: 2 * DAY + 10 * HOUR,
                likes: 29
            }
        ];

        return presets.map((preset, index) => ({
            id: 'moment_' + (index + 1),
            characterId: preset.characterId,
            content: preset.content,
            timestamp: now - preset.timeOffset,
            likes: preset.likes,
            time: this.formatMomentTime(now - preset.timeOffset)
        }));
    }

    /**
     * 格式化朋友圈时间显示
     * @param {number} timestamp - 时间戳
     * @returns {string} 格式化的时间字符串
     */
    formatMomentTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const MINUTE = 60000;
        const HOUR = 3600000;
        const DAY = 86400000;

        if (diff < MINUTE) {
            return '刚刚';
        } else if (diff < HOUR) {
            return Math.floor(diff / MINUTE) + '分钟前';
        } else if (diff < DAY) {
            return Math.floor(diff / HOUR) + '小时前';
        } else if (diff < 2 * DAY) {
            return '昨天';
        } else if (diff < 3 * DAY) {
            return '前天';
        } else {
            const date = new Date(timestamp);
            return (date.getMonth() + 1) + '月' + date.getDate() + '日';
        }
    }

    /**
     * 获取所有朋友圈动态
     * @returns {Array} 动态数组（按时间倒序）
     */
    getAllMoments() {
        return this.moments.map(moment => ({
            ...moment,
            time: this.formatMomentTime(moment.timestamp),
            liked: !!this.userLikes[moment.id],
            commentList: this.comments[moment.id] || []
        }));
    }

    /**
     * 切换点赞状态
     * @param {string} momentId - 动态ID
     * @returns {Object} { liked, likes } 更新后的点赞状态和数量
     */
    toggleLike(momentId) {
        const moment = this.moments.find(m => m.id === momentId);
        if (!moment) return null;

        if (this.userLikes[momentId]) {
            // 取消点赞（添加下界保护，防止点赞数为负数）
            this.userLikes[momentId] = false;
            moment.likes = Math.max(0, moment.likes - 1);
        } else {
            // 点赞
            this.userLikes[momentId] = true;
            moment.likes++;
        }

        return {
            liked: this.userLikes[momentId],
            likes: moment.likes
        };
    }

    /**
     * 添加评论
     * @param {string} momentId - 动态ID
     * @param {string} content - 评论内容
     * @returns {Object|null} 新评论对象
     */
    addComment(momentId, content) {
        if (!content || !content.trim()) return null;

        const moment = this.moments.find(m => m.id === momentId);
        if (!moment) return null;

        if (!this.comments[momentId]) {
            this.comments[momentId] = [];
        }

        const comment = {
            id: 'comment_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
            author: '我',
            content: content.trim(),
            time: this.formatMomentTime(Date.now())
        };

        this.comments[momentId].push(comment);

        // AI角色自动回复评论
        this.generateAIReply(momentId, content.trim());

        return comment;
    }

    /**
     * AI角色自动回复用户评论
     * @param {string} momentId - 动态ID
     * @param {string} userComment - 用户评论内容
     */
    generateAIReply(momentId, userComment) {
        const moment = this.moments.find(m => m.id === momentId);
        if (!moment) return;

        // 防御性校验：确保 getCharacterById 函数可用
        if (typeof getCharacterById !== 'function') return;
        const character = getCharacterById(moment.characterId);
        if (!character) return;

        // 根据角色性格生成简短回复
        const replies = this.getCommentReplies(character.id);
        const reply = replies[Math.floor(Math.random() * replies.length)];

        // 延迟添加AI回复（保存timer引用以便清理）
        const timerId = setTimeout(() => {
            if (!this.comments[momentId]) {
                this.comments[momentId] = [];
            }

            this.comments[momentId].push({
                id: 'comment_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
                author: character.name,
                content: reply,
                time: '刚刚',
                isAI: true,
                characterId: character.id
            });

            // 触发UI更新事件
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('moments-comment-update', {
                    detail: { momentId }
                }));
            }
            // 从待处理列表中移除已完成的timer
            this.pendingTimers = this.pendingTimers.filter(t => t !== timerId);
        }, 1000 + Math.random() * 2000);
        this.pendingTimers.push(timerId);
    }

    /**
     * 清除所有待处理的AI回复定时器
     * 在页面卸载或重置时调用
     */
    clearPendingTimers() {
        this.pendingTimers.forEach(timerId => clearTimeout(timerId));
        this.pendingTimers = [];
    }

    /**
     * 获取角色的评论回复预设
     * @param {string} characterId - 角色ID
     * @returns {Array} 回复内容数组
     */
    getCommentReplies(characterId) {
        const replyPresets = {
            xiaowei: [
                '谢谢你的评论呀～ 😊',
                '嗯嗯，很开心你也有同感～',
                '你说得好有道理，下次一起呀',
                '哈哈，被你发现了～',
                '谢谢关心，你也要开心哦'
            ],
            laowang: [
                '说得有道理，看来你也思考过这个问题。',
                '是的，这个话题确实值得深入探讨。',
                '哈哈，欢迎随时来交流。',
                '你的观点很有启发性。',
                '嗯，我们可以找时间详细聊聊。'
            ],
            mengmeng: [
                '哇！谢谢夸奖！(≧▽≦)',
                '嘿嘿嘿～萌萌超开心的！',
                '对对对！！你也觉得对吧！！',
                '一起一起！下次约起来！✨',
                '么么哒～你最好了！(づ￣ ³￣)づ'
            ],
            dashi: [
                '善哉善哉，有缘人。',
                '你已有所悟，甚好。',
                '茶已备好，随时可来坐坐。',
                '然也。',
                '道不远人，人自远道。共勉。'
            ],
            xiaohei: [
                '哈哈哈你这评论比我段子还好笑',
                '得了吧就你话多 😏 开玩笑的谢谢',
                '你居然看到了这条...算你有眼光',
                '行行行你说得对 我不反驳',
                '笑死 你比我还能吐槽'
            ]
        };

        return replyPresets[characterId] || ['谢谢评论～'];
    }

    /**
     * 获取单条动态的详细信息
     * @param {string} momentId - 动态ID
     * @returns {Object|null} 动态详情
     */
    getMomentById(momentId) {
        const moment = this.moments.find(m => m.id === momentId);
        if (!moment) return null;

        return {
            ...moment,
            time: this.formatMomentTime(moment.timestamp),
            liked: !!this.userLikes[moment.id],
            commentList: this.comments[moment.id] || []
        };
    }
}

// 创建全局朋友圈引擎实例
const momentsEngine = new MomentsEngine();
