/**
 * 应用主模块
 * 负责UI渲染、事件绑定和页面交互
 */

class SocialApp {
    constructor() {
        this.currentCharacterId = null;
        this.isTyping = false;
        this.currentTab = 'contacts';

        // DOM引用
        this.contactsPage = document.getElementById('contacts-page');
        this.chatPage = document.getElementById('chat-page');
        this.momentsPage = document.getElementById('moments-page');
        this.contactsList = document.getElementById('contacts-list');
        this.momentsList = document.getElementById('moments-list');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.backBtn = document.getElementById('back-btn');
        this.chatName = document.getElementById('chat-name');
        this.chatAvatar = document.getElementById('chat-avatar');
        this.chatStatus = document.getElementById('chat-status');
        this.searchInput = document.getElementById('search-input');

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.renderContactsList();
        this.bindEvents();
    }

    /**
     * 渲染联系人列表
     * @param {string} filter - 搜索过滤关键词
     */
    renderContactsList(filter = '') {
        const characters = getAllCharacters();
        const filtered = filter
            ? characters.filter(c =>
                c.name.includes(filter) ||
                c.personality.includes(filter) ||
                c.description.includes(filter)
            )
            : characters;

        this.contactsList.innerHTML = filtered.map(character => {
            const preview = chatEngine.getLastMessagePreview(character.id);
            const previewText = preview ? preview.content : character.description;
            const previewTime = preview ? preview.time : '';

            return `
                <div class="contact-item" data-id="${character.id}">
                    <div class="contact-avatar" style="background-color: ${character.avatarBg}">
                        ${character.avatar}
                    </div>
                    <div class="contact-info">
                        <div class="contact-name">${character.name}</div>
                        <div class="contact-preview">${previewText}</div>
                    </div>
                    <div class="contact-meta">
                        <div class="contact-time">${previewTime}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 绑定所有事件监听
     */
    bindEvents() {
        // 联系人点击
        this.contactsList.addEventListener('click', (e) => {
            const contactItem = e.target.closest('.contact-item');
            if (contactItem) {
                const characterId = contactItem.dataset.id;
                this.openChat(characterId);
            }
        });

        // 返回按钮
        this.backBtn.addEventListener('click', () => {
            this.closeChat();
        });

        // 发送按钮
        this.sendBtn.addEventListener('click', () => {
            this.handleSend();
        });

        // 输入框回车发送
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // 输入框自动调高
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
        });

        // 搜索功能
        this.searchInput.addEventListener('input', (e) => {
            this.renderContactsList(e.target.value.trim());
        });

        // Tab导航点击
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 朋友圈评论更新事件
        window.addEventListener('moments-comment-update', (e) => {
            const { momentId } = e.detail;
            this.updateMomentComments(momentId);
        });

        // 朋友圈动态列表事件委托
        this.momentsList.addEventListener('click', (e) => {
            this.handleMomentsClick(e);
        });
    }

    /**
     * 切换Tab页面
     * @param {string} tabName - 目标Tab名称 ('contacts' 或 'moments')
     */
    switchTab(tabName) {
        if (tabName === this.currentTab) return;

        this.currentTab = tabName;

        // 更新所有Tab状态
        document.querySelectorAll('.tab-item').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 切换页面显示
        if (tabName === 'contacts') {
            this.momentsPage.classList.remove('active');
            this.contactsPage.classList.add('active');
        } else if (tabName === 'moments') {
            this.contactsPage.classList.remove('active');
            this.momentsPage.classList.add('active');
            this.renderMomentsList();
        }
    }

    /**
     * 渲染朋友圈动态列表
     */
    renderMomentsList() {
        const moments = momentsEngine.getAllMoments();

        this.momentsList.innerHTML = moments.map(moment => {
            const character = getCharacterById(moment.characterId);
            if (!character) return '';

            const likedClass = moment.liked ? 'liked' : '';
            const likeText = moment.liked ? '已赞' : '赞';
            const commentsHtml = this.renderMomentComments(moment);

            return `
                <div class="moment-item" data-moment-id="${moment.id}">
                    <div class="moment-header">
                        <div class="moment-avatar" style="background-color: ${character.avatarBg}">
                            ${character.avatar}
                        </div>
                        <div class="moment-author-info">
                            <div class="moment-author-name">${character.name}</div>
                            <div class="moment-time">${moment.time}</div>
                        </div>
                    </div>
                    <div class="moment-content">${this.escapeHtml(moment.content)}</div>
                    <div class="moment-actions">
                        <span class="moment-likes">${moment.likes > 0 ? moment.likes + ' 人觉得很赞' : ''}</span>
                        <div class="moment-action-btns">
                            <button class="moment-action-btn ${likedClass}" data-action="like" data-moment-id="${moment.id}">
                                ❤ ${likeText}
                            </button>
                            <button class="moment-action-btn" data-action="comment" data-moment-id="${moment.id}">
                                💬 评论
                            </button>
                        </div>
                    </div>
                    ${commentsHtml}
                    <div class="moment-comment-input-wrapper" data-moment-id="${moment.id}">
                        <input type="text" class="moment-comment-input" placeholder="写评论..." data-moment-id="${moment.id}">
                        <button class="moment-comment-submit" data-action="submit-comment" data-moment-id="${moment.id}">发送</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染单条动态的评论区域
     * @param {Object} moment - 动态对象
     * @returns {string} 评论区HTML
     */
    renderMomentComments(moment) {
        if (!moment.commentList || moment.commentList.length === 0) {
            return '<div class="moment-comments"></div>';
        }

        const commentsItems = moment.commentList.map(comment => {
            return `
                <div class="moment-comment-item">
                    <span class="comment-author">${this.escapeHtml(comment.author)}</span>：<span class="comment-content">${this.escapeHtml(comment.content)}</span>
                </div>
            `;
        }).join('');

        return `<div class="moment-comments">${commentsItems}</div>`;
    }

    /**
     * 处理朋友圈列表的点击事件
     * @param {Event} e - 点击事件
     */
    handleMomentsClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const momentId = target.dataset.momentId;

        if (action === 'like') {
            this.handleMomentLike(momentId);
        } else if (action === 'comment') {
            this.toggleCommentInput(momentId);
        } else if (action === 'submit-comment') {
            this.handleMomentComment(momentId);
        }
    }

    /**
     * 处理朋友圈点赞
     * @param {string} momentId - 动态ID
     */
    handleMomentLike(momentId) {
        const result = momentsEngine.toggleLike(momentId);
        if (!result) return;

        // 更新UI
        const momentItem = this.momentsList.querySelector(`[data-moment-id="${momentId}"].moment-item`);
        if (!momentItem) return;

        const likeBtn = momentItem.querySelector('[data-action="like"]');
        const likesText = momentItem.querySelector('.moment-likes');

        if (result.liked) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '❤ 已赞';
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '❤ 赞';
        }

        likesText.textContent = result.likes > 0 ? result.likes + ' 人觉得很赞' : '';
    }

    /**
     * 切换评论输入框显示
     * @param {string} momentId - 动态ID
     */
    toggleCommentInput(momentId) {
        const momentItem = this.momentsList.querySelector(`[data-moment-id="${momentId}"].moment-item`);
        if (!momentItem) return;

        const inputWrapper = momentItem.querySelector('.moment-comment-input-wrapper');
        inputWrapper.classList.toggle('show');

        if (inputWrapper.classList.contains('show')) {
            const input = inputWrapper.querySelector('.moment-comment-input');
            input.focus();

            // 绑定回车发送
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleMomentComment(momentId);
                }
            };
        }
    }

    /**
     * 处理朋友圈评论提交
     * @param {string} momentId - 动态ID
     */
    handleMomentComment(momentId) {
        const momentItem = this.momentsList.querySelector(`[data-moment-id="${momentId}"].moment-item`);
        if (!momentItem) return;

        const input = momentItem.querySelector('.moment-comment-input');
        const content = input.value.trim();
        if (!content) return;

        // 添加评论到数据层
        const comment = momentsEngine.addComment(momentId, content);
        if (!comment) return;

        // 清空输入框
        input.value = '';

        // 更新评论UI
        this.updateMomentComments(momentId);
    }

    /**
     * 更新某条动态的评论显示
     * @param {string} momentId - 动态ID
     */
    updateMomentComments(momentId) {
        const momentItem = this.momentsList.querySelector(`[data-moment-id="${momentId}"].moment-item`);
        if (!momentItem) return;

        const moment = momentsEngine.getMomentById(momentId);
        if (!moment) return;

        // 替换评论区域
        const oldComments = momentItem.querySelector('.moment-comments');
        const newCommentsHtml = this.renderMomentComments(moment);
        const temp = document.createElement('div');
        temp.innerHTML = newCommentsHtml;
        const newComments = temp.firstElementChild;

        if (oldComments) {
            oldComments.replaceWith(newComments);
        } else {
            const inputWrapper = momentItem.querySelector('.moment-comment-input-wrapper');
            momentItem.insertBefore(newComments, inputWrapper);
        }
    }

    /**
     * 打开聊天页面
     * @param {string} characterId - 角色ID
     */
    openChat(characterId) {
        const character = getCharacterById(characterId);
        if (!character) return;

        this.currentCharacterId = characterId;

        // 更新头部信息
        this.chatName.textContent = character.name;
        this.chatAvatar.src = this.createAvatarDataUrl(character.avatar, character.avatarBg);
        this.chatStatus.textContent = character.status;

        // 渲染聊天历史
        this.renderMessages(characterId);

        // 如果没有历史消息，显示打招呼
        const history = chatEngine.getHistory(characterId);
        if (history.length === 0) {
            const greeting = chatEngine.getGreeting(characterId);
            if (greeting) {
                chatEngine.chatHistories[characterId] = [greeting];
                this.renderMessages(characterId);
            }
        }

        // 切换页面
        this.contactsPage.classList.remove('active');
        this.chatPage.classList.add('active');

        // 聚焦输入框
        setTimeout(() => this.messageInput.focus(), 300);
    }

    /**
     * 关闭聊天页面
     */
    closeChat() {
        this.currentCharacterId = null;
        this.chatPage.classList.remove('active');
        this.contactsPage.classList.add('active');

        // 刷新联系人列表预览
        this.renderContactsList(this.searchInput.value.trim());
    }

    /**
     * 处理发送消息
     */
    handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || !this.currentCharacterId || this.isTyping) return;

        // 清空输入框
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // 发送用户消息
        const { userMsg, aiMsg } = chatEngine.sendMessage(this.currentCharacterId, message);

        // 渲染用户消息
        this.appendMessage(userMsg, 'self');
        this.scrollToBottom();

        // 模拟AI打字延迟
        this.showTypingIndicator();

        const typingDelay = Math.random() * 1500 + 800; // 800ms - 2300ms
        setTimeout(() => {
            this.hideTypingIndicator();
            this.appendMessage(aiMsg, 'other');
            this.scrollToBottom();
        }, typingDelay);
    }

    /**
     * 渲染所有消息
     * @param {string} characterId - 角色ID
     */
    renderMessages(characterId) {
        const messages = chatEngine.getHistory(characterId);
        const character = getCharacterById(characterId);

        this.messagesContainer.innerHTML = messages.map(msg => {
            const isUser = msg.type === 'user';
            const avatarSrc = isUser
                ? this.createAvatarDataUrl('🙂', '#E3F2FD')
                : this.createAvatarDataUrl(character.avatar, character.avatarBg);

            return this.createMessageHTML(msg, isUser ? 'self' : 'other', avatarSrc);
        }).join('');

        this.scrollToBottom();
    }

    /**
     * 追加单条消息到聊天区域
     * @param {Object} msg - 消息对象
     * @param {string} type - 'self' 或 'other'
     */
    appendMessage(msg, type) {
        const character = getCharacterById(this.currentCharacterId);
        const avatarSrc = type === 'self'
            ? this.createAvatarDataUrl('🙂', '#E3F2FD')
            : this.createAvatarDataUrl(character.avatar, character.avatarBg);

        const html = this.createMessageHTML(msg, type, avatarSrc);
        const typingEl = this.messagesContainer.querySelector('.typing-message');
        if (typingEl) {
            typingEl.insertAdjacentHTML('beforebegin', html);
        } else {
            this.messagesContainer.insertAdjacentHTML('beforeend', html);
        }
    }

    /**
     * 创建消息HTML
     * @param {Object} msg - 消息对象
     * @param {string} type - 'self' 或 'other'
     * @param {string} avatarSrc - 头像URL
     * @returns {string} HTML字符串
     */
    createMessageHTML(msg, type, avatarSrc) {
        return `
            <div class="message ${type}">
                <img class="message-avatar" src="${avatarSrc}" alt="">
                <div class="message-content">
                    <div class="message-bubble">${this.escapeHtml(msg.content)}</div>
                    <div class="message-time">${msg.time}</div>
                </div>
            </div>
        `;
    }

    /**
     * 显示正在输入指示器
     */
    showTypingIndicator() {
        this.isTyping = true;
        const character = getCharacterById(this.currentCharacterId);
        const avatarSrc = this.createAvatarDataUrl(character.avatar, character.avatarBg);

        const html = `
            <div class="message other typing-message">
                <img class="message-avatar" src="${avatarSrc}" alt="">
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        this.messagesContainer.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
    }

    /**
     * 隐藏正在输入指示器
     */
    hideTypingIndicator() {
        this.isTyping = false;
        const typingEl = this.messagesContainer.querySelector('.typing-message');
        if (typingEl) {
            typingEl.remove();
        }
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 50);
    }

    /**
     * 创建emoji头像的Data URL
     * @param {string} emoji - Emoji字符
     * @param {string} bgColor - 背景颜色
     * @returns {string} Data URL
     */
    createAvatarDataUrl(emoji, bgColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');

        // 背景
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(40, 40, 40, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 40, 42);

        return canvas.toDataURL();
    }

    /**
     * HTML转义，防止XSS
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SocialApp();
});
