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
        this.tabBar = document.getElementById('tab-bar');

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
        // 联系人点击 → 进入聊天
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

        // 底部Tab点击
        this.tabBar.addEventListener('click', (e) => {
            const tabItem = e.target.closest('.tab-item');
            if (tabItem) {
                const tabName = tabItem.dataset.tab;
                this.switchTab(tabName);
            }
        });

        // 朋友圈事件委托（点赞、评论）
        this.momentsList.addEventListener('click', (e) => {
            this.handleMomentsClick(e);
        });

        // 监听AI评论回复事件
        window.addEventListener('moments-comment-update', (e) => {
            const { momentId } = e.detail;
            this.updateMomentComments(momentId);
        });
    }

    // ==================== Tab切换 ====================

    /**
     * 切换底部Tab页面
     * @param {string} tabName - 'contacts' 或 'moments'
     */
    switchTab(tabName) {
        if (tabName === this.currentTab) return;
        this.currentTab = tabName;

        // 更新Tab激活状态
        this.tabBar.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 隐藏所有非聊天页
        this.contactsPage.classList.remove('active');
        this.momentsPage.classList.remove('active');

        // 显示目标页
        if (tabName === 'contacts') {
            this.contactsPage.classList.add('active');
        } else if (tabName === 'moments') {
            this.momentsPage.classList.add('active');
            this.renderMomentsList();
        }
    }

    // ==================== 朋友圈功能 ====================

    /**
     * 渲染朋友圈动态列表
     */
    renderMomentsList() {
        const moments = momentsEngine.getAllMoments();

        this.momentsList.innerHTML = moments.map(moment => {
            const character = getCharacterById(moment.characterId);
            if (!character) return '';

            const likedClass = moment.liked ? 'liked' : '';
            const likeText = moment.liked ? '❤️ 已赞' : '🤍 赞';
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
                        <span class="moment-likes">${moment.likes > 0 ? '❤️ ' + moment.likes : ''}</span>
                        <div class="moment-action-btns">
                            <button class="moment-action-btn ${likedClass}" data-action="like" data-moment-id="${moment.id}">
                                ${likeText}
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
     * 渲染单条动态的评论
     * @param {Object} moment - 动态对象
     * @returns {string} HTML
     */
    renderMomentComments(moment) {
        if (!moment.commentList || moment.commentList.length === 0) {
            return '<div class="moment-comments"></div>';
        }

        const items = moment.commentList.map(comment => `
            <div class="moment-comment-item">
                <span class="comment-author">${this.escapeHtml(comment.author)}</span>：<span class="comment-content">${this.escapeHtml(comment.content)}</span>
            </div>
        `).join('');

        return `<div class="moment-comments">${items}</div>`;
    }

    /**
     * 处理朋友圈内的点击
     * @param {Event} e
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
     * 处理点赞
     */
    handleMomentLike(momentId) {
        const result = momentsEngine.toggleLike(momentId);
        if (!result) return;

        const momentItem = this.momentsList.querySelector(`.moment-item[data-moment-id="${momentId}"]`);
        if (!momentItem) return;

        const likeBtn = momentItem.querySelector('[data-action="like"]');
        const likesSpan = momentItem.querySelector('.moment-likes');

        if (result.liked) {
            likeBtn.classList.add('liked');
            likeBtn.textContent = '❤️ 已赞';
        } else {
            likeBtn.classList.remove('liked');
            likeBtn.textContent = '🤍 赞';
        }

        likesSpan.textContent = result.likes > 0 ? '❤️ ' + result.likes : '';
    }

    /**
     * 切换评论输入框
     */
    toggleCommentInput(momentId) {
        const momentItem = this.momentsList.querySelector(`.moment-item[data-moment-id="${momentId}"]`);
        if (!momentItem) return;

        const wrapper = momentItem.querySelector('.moment-comment-input-wrapper');
        wrapper.classList.toggle('show');

        if (wrapper.classList.contains('show')) {
            const input = wrapper.querySelector('.moment-comment-input');
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleMomentComment(momentId);
                }
            };
        }
    }

    /**
     * 提交评论
     */
    handleMomentComment(momentId) {
        const momentItem = this.momentsList.querySelector(`.moment-item[data-moment-id="${momentId}"]`);
        if (!momentItem) return;

        const input = momentItem.querySelector('.moment-comment-input');
        const content = input.value.trim();
        if (!content) return;

        const comment = momentsEngine.addComment(momentId, content);
        if (!comment) return;

        input.value = '';
        this.updateMomentComments(momentId);
    }

    /**
     * 更新某条动态的评论区
     */
    updateMomentComments(momentId) {
        const momentItem = this.momentsList.querySelector(`.moment-item[data-moment-id="${momentId}"]`);
        if (!momentItem) return;

        const moment = momentsEngine.getMomentById(momentId);
        if (!moment) return;

        const oldComments = momentItem.querySelector('.moment-comments');
        const newHtml = this.renderMomentComments(moment);
        const temp = document.createElement('div');
        temp.innerHTML = newHtml;
        const newComments = temp.firstElementChild;

        if (oldComments) {
            oldComments.replaceWith(newComments);
        }
    }

    // ==================== 聊天功能 ====================

    /**
     * 打开聊天页面
     */
    openChat(characterId) {
        const character = getCharacterById(characterId);
        if (!character) return;

        this.currentCharacterId = characterId;

        // 更新聊天头部
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

        // 显示聊天页，隐藏tab
        this.contactsPage.classList.remove('active');
        this.momentsPage.classList.remove('active');
        this.chatPage.classList.add('active');
        this.tabBar.classList.add('hidden');

        setTimeout(() => this.messageInput.focus(), 300);
    }

    /**
     * 关闭聊天页面
     */
    closeChat() {
        this.currentCharacterId = null;
        this.chatPage.classList.remove('active');
        this.tabBar.classList.remove('hidden');

        // 恢复之前的tab页
        if (this.currentTab === 'contacts') {
            this.contactsPage.classList.add('active');
            this.renderContactsList(this.searchInput.value.trim());
        } else {
            this.momentsPage.classList.add('active');
        }
    }

    /**
     * 处理发送消息
     */
    handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || !this.currentCharacterId || this.isTyping) return;

        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        const { userMsg, aiMsg } = chatEngine.sendMessage(this.currentCharacterId, message);

        this.appendMessage(userMsg, 'self');
        this.scrollToBottom();

        // 模拟AI打字延迟
        this.showTypingIndicator();
        const typingDelay = Math.random() * 1500 + 800;
        setTimeout(() => {
            this.hideTypingIndicator();
            this.appendMessage(aiMsg, 'other');
            this.scrollToBottom();
        }, typingDelay);
    }

    /**
     * 渲染所有消息
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
     * 追加消息
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

    hideTypingIndicator() {
        this.isTyping = false;
        const typingEl = this.messagesContainer.querySelector('.typing-message');
        if (typingEl) typingEl.remove();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 50);
    }

    // ==================== 工具方法 ====================

    createAvatarDataUrl(emoji, bgColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(40, 40, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 40, 42);

        return canvas.toDataURL();
    }

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
