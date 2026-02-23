// 应用主逻辑

class PokerApp {
    constructor() {
        this.selectedCards = {
            hand: [null, null],
            community: [null, null, null, null, null]
        };
        this.currentStage = 'preflop';
        this.currentCardSlot = null;
        this.currentSuit = 'spade';
        this.usedCards = new Set();
        this.history = this.loadHistory();
        this.currentDecision = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderRankGrid();
        this.renderHistory();
    }

    bindEvents() {
        // 阶段按钮
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectStage(btn.dataset.stage));
        });

        // 手牌槽
        document.getElementById('card1').addEventListener('click', () => this.openCardPicker('hand', 0));
        document.getElementById('card2').addEventListener('click', () => this.openCardPicker('hand', 1));

        // 公共牌槽
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`comm${i}`).addEventListener('click', () => this.openCardPicker('community', i - 1));
        }

        // 花色标签
        document.querySelectorAll('.suit-tab').forEach(tab => {
            tab.addEventListener('click', () => this.selectSuit(tab.dataset.suit));
        });

        // 关闭选择器
        document.getElementById('closePicker').addEventListener('click', () => this.closeCardPicker());

        // 快速选择起手牌
        document.querySelectorAll('.hand-type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectHandType(btn.dataset.type));
        });

        // 分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());

        // 玩家人数变化时更新位置选项
        document.getElementById('players').addEventListener('input', () => this.updatePositionOptions());

        // 点击模态框外部关闭
        document.getElementById('cardPickerModal').addEventListener('click', (e) => {
            if (e.target.id === 'cardPickerModal') {
                this.closeCardPicker();
            }
        });

        // 初始化位置选项
        this.updatePositionOptions();

        // 历史记录筛选
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => this.filterHistory(tab.dataset.filter));
        });

        // 导出和清空按钮
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearHistory());

        // 保存结果和取消按钮
        document.getElementById('saveResultBtn').addEventListener('click', () => this.saveResult());
        document.getElementById('cancelResultBtn').addEventListener('click', () => this.cancelResult());
    }

    // ====== 历史记录管理 ======
    loadHistory() {
        const saved = localStorage.getItem('pokerHistory');
        return saved ? JSON.parse(saved) : [];
    }

    saveHistoryToStorage() {
        localStorage.setItem('pokerHistory', JSON.stringify(this.history));
    }

    addHistoryEntry(entry) {
        this.history.unshift(entry);
        if (this.history.length > 100) { // 限制最多100条记录
            this.history = this.history.slice(0, 100);
        }
        this.saveHistoryToStorage();
        this.renderHistory();
    }

    loadHistoryToStorage() {
        localStorage.setItem('pokerHistory', JSON.stringify(this.history));
    }

    saveResult() {
        if (!this.currentDecision) return;

        const result = document.getElementById('finalResult').value;
        const note = document.getElementById('resultNote').value.trim();

        // 更新当前记录的结果
        const entry = {
            ...this.currentDecision,
            finalResult: result,
            resultNote: note,
            timestamp: Date.now()
        };

        this.addHistoryEntry(entry);

        // 隐藏结果输入区域
        document.getElementById('resultInputSection').style.display = 'none';

        // 清空输入
        document.getElementById('resultNote').value = '';

        this.currentDecision = null;
    }

    cancelResult() {
        document.getElementById('resultInputSection').style.display = 'none';
        document.getElementById('resultNote').value = '';
    }

    filterHistory(filter) {
        // 更新标签状态
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        this.renderHistory(filter);
    }

    renderHistory(filter = 'all') {
        const historyList = document.getElementById('historyList');
        const historyStats = document.getElementById('historyStats');

        // 筛选记录
        let filteredHistory = this.history;
        if (filter !== 'all') {
            filteredHistory = this.history.filter(entry => entry.finalResult === filter);
        }

        // 更新统计
        this.updateStats();

        if (filteredHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">
                        ${filter === 'all' ? '还没有任何记录，开始使用APP吧！' : `暂无${this.getResultText(filter)}记录`}
                    </div>
                </div>
            `;
            return;
        }

        // 渲染列表
        historyList.innerHTML = filteredHistory.map((entry, index) => this.renderHistoryItem(entry, index)).join('');

        // 绑定展开/折叠事件
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-item-toggle')) {
                    item.classList.toggle('expanded');
                }
            });
        });

        historyList.querySelectorAll('.history-item-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle.closest('.history-item').classList.toggle('expanded');
            });
        });
    }

    renderHistoryItem(entry, index) {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const resultText = this.getResultText(entry.finalResult);
        const actionText = {
            'fold': '弃牌',
            'call': '跟注',
            'raise': '加注',
            'allin': '全押'
        };

        return `
            <div class="history-item ${entry.finalResult || ''}" data-index="${index}">
                <div class="history-item-header">
                    <span class="history-item-date">${dateStr}</span>
                    ${entry.finalResult ? `<span class="history-item-result">${resultText}</span>` : ''}
                </div>
                <div class="history-item-content">
                    <div class="history-item-cards">
                        <strong>手牌：</strong>${this.renderMiniCards(entry.handCards)}
                        ${entry.communityCards && entry.communityCards.length > 0 ?
                            `<br><strong>公共牌：</strong>${this.renderMiniCards(entry.communityCards)}` : ''}
                    </div>
                    <div class="history-item-decision">
                        <strong>GTO建议：</strong>
                        <span class="history-decision-action ${entry.action}">${actionText[entry.action]}</span>
                        ${entry.equity !== undefined ?
                            `<span class="history-item-equity">胜率 ${(entry.equity * 100).toFixed(1)}%</span>` : ''}
                    </div>
                    ${entry.resultNote ? `<div class="history-item-note">💭 ${entry.resultNote}</div>` : ''}
                </div>
                <div class="history-item-toggle">点击查看详情</div>
                <div class="history-item-details">
                    <div class="history-detail-grid">
                        <div class="history-detail-item">
                            <span class="history-detail-label">阶段：</span>
                            <span class="history-detail-value">${this.getStageText(entry.stage)}</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">玩家人数：</span>
                            <span class="history-detail-value">${entry.players}人</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">位置：</span>
                            <span class="history-detail-value">${entry.position}</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">底池：</span>
                            <span class="history-detail-value">${entry.pot}筹码</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">需要跟注：</span>
                            <span class="history-detail-value">${entry.betToCall}筹码</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">你的筹码：</span>
                            <span class="history-detail-value">${entry.stack}筹码</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">底池赔率：</span>
                            <span class="history-detail-value">${(entry.potOdds * 100).toFixed(1)}%</span>
                        </div>
                        <div class="history-detail-item">
                            <span class="history-detail-label">决策原因：</span>
                            <span class="history-detail-value">${entry.reason}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMiniCards(cards) {
        if (!cards || cards.length === 0) return '';

        return cards.map(card => {
            const suitSymbol = {
                'spade': '♠',
                'heart': '♥',
                'diamond': '♦',
                'club': '♣'
            }[card.suit];

            return `
                <span class="mini-card ${card.suit}">
                    ${card.rank}${suitSymbol}
                </span>
            `;
        }).join('');
    }

    getResultText(result) {
        const texts = {
            'win': '✅ 胜利',
            'loss': '❌ 失败',
            'tie': '⚖️ 平局'
        };
        return texts[result] || '未记录';
    }

    getStageText(stage) {
        const texts = {
            'preflop': '翻前',
            'flop': '翻牌',
            'turn': '转牌',
            'river': '河牌'
        };
        return texts[stage] || stage;
    }

    updateStats() {
        const historyStats = document.getElementById('historyStats');

        const total = this.history.length;
        const wins = this.history.filter(e => e.finalResult === 'win').length;
        const losses = this.history.filter(e => e.finalResult === 'loss').length;
        const ties = this.history.filter(e => e.finalResult === 'tie').length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

        historyStats.innerHTML = `
            <div class="stat-card">
                <div class="label">总场次</div>
                <div class="value">${total}</div>
            </div>
            <div class="stat-card win">
                <div class="label">胜利</div>
                <div class="value">${wins}</div>
            </div>
            <div class="stat-card loss">
                <div class="label">失败</div>
                <div class="value">${losses}</div>
            </div>
            <div class="stat-card tie">
                <div class="label">平局</div>
                <div class="value">${ties}</div>
            </div>
            <div class="stat-card">
                <div class="label">胜率</div>
                <div class="value">${winRate}%</div>
            </div>
        `;
    }

    exportHistory() {
        if (this.history.length === 0) {
            alert('还没有任何记录可以导出！');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `GTO决策记录_${new Date().toLocaleDateString('zh-CN')}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    generateCSV() {
        const headers = ['时间', '阶段', '玩家人数', '位置', '手牌', '公共牌', '底池', '需要跟注', '你的筹码', '决策', '胜率', '底池赔率', '最终结果', '备注'];
        const rows = this.history.map(entry => {
            const date = new Date(entry.timestamp).toLocaleString('zh-CN');
            const handCards = entry.handCards ? entry.handCards.map(c => `${c.rank}${c.suit}`).join(' ') : '';
            const communityCards = entry.communityCards ? entry.communityCards.map(c => `${c.rank}${c.suit}`).join(' ') : '';
            const actionText = { 'fold': '弃牌', 'call': '跟注', 'raise': '加注', 'allin': '全押' }[entry.action] || entry.action;
            const resultText = { 'win': '胜利', 'loss': '失败', 'tie': '平局' }[entry.finalResult] || '未记录';

            return [
                date,
                this.getStageText(entry.stage),
                entry.players,
                entry.position,
                handCards,
                communityCards,
                entry.pot,
                entry.betToCall,
                entry.stack,
                actionText,
                entry.equity !== undefined ? (entry.equity * 100).toFixed(1) + '%' : 'N/A',
                (entry.potOdds * 100).toFixed(1) + '%',
                resultText,
                entry.resultNote || ''
            ];
        });

        const csvArray = [headers, ...rows];
        return csvArray.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    clearHistory() {
        if (this.history.length === 0) {
            alert('历史记录已经是空的了！');
            return;
        }

        if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
            this.history = [];
            this.saveHistoryToStorage();
            this.renderHistory();
            alert('历史记录已清空！');
        }
    }

    // ====== 分析决策并保存 ======

    selectStage(stage) {
        this.currentStage = stage;
        
        // 更新按钮状态
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.stage === stage);
        });

        // 显示/隐藏公共牌区域
        const communitySection = document.getElementById('communitySection');
        communitySection.style.display = stage === 'preflop' ? 'none' : 'block';

        // 显示相应数量的公共牌槽
        const cardCounts = { flop: 3, turn: 4, river: 5 };
        const count = cardCounts[stage] || 0;

        for (let i = 1; i <= 5; i++) {
            const slot = document.getElementById(`comm${i}`);
            slot.style.display = i <= count ? 'flex' : 'none';
        }
    }

    openCardPicker(type, index) {
        this.currentCardSlot = { type, index };
        document.getElementById('cardPickerModal').classList.add('show');
        this.updateRankGrid();
    }

    closeCardPicker() {
        document.getElementById('cardPickerModal').classList.remove('show');
        this.currentCardSlot = null;
    }

    selectSuit(suit) {
        this.currentSuit = suit;
        document.querySelectorAll('.suit-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.suit === suit);
        });
        this.renderRankGrid();
    }

    renderRankGrid() {
        const grid = document.getElementById('rankGrid');
        const suitSymbol = SUITS[this.currentSuit].symbol;
        
        grid.innerHTML = RANKS.map(rank => {
            const cardKey = rank + suitSymbol;
            const isUsed = this.usedCards.has(cardKey);
            
            return `
                <button class="rank-btn ${isUsed ? 'used' : ''}" 
                        data-rank="${rank}" 
                        ${isUsed ? 'disabled' : ''}>
                    ${rank}${suitSymbol}
                </button>
            `;
        }).join('');

        // 绑定点击事件
        grid.querySelectorAll('.rank-btn:not(.used)').forEach(btn => {
            btn.addEventListener('click', () => this.selectCard(btn.dataset.rank));
        });
    }

    updateRankGrid() {
        this.renderRankGrid();
    }

    selectCard(rank) {
        if (!this.currentCardSlot) return;

        const { type, index } = this.currentCardSlot;
        const card = new Card(rank, this.currentSuit);
        const cardKey = card.toString();

        // 检查是否已使用
        if (this.usedCards.has(cardKey)) {
            alert('这张牌已经被选择了！');
            return;
        }

        // 如果该位置已有牌，先移除
        const oldCard = this.selectedCards[type][index];
        if (oldCard) {
            this.usedCards.delete(oldCard.toString());
        }

        // 设置新牌
        this.selectedCards[type][index] = card;
        this.usedCards.add(cardKey);

        // 更新UI
        this.updateCardSlot(type, index, card);
        this.closeCardPicker();
    }

    updateCardSlot(type, index, card) {
        const slotId = type === 'hand' ? `card${index + 1}` : `comm${index + 1}`;
        const slot = document.getElementById(slotId);

        if (card) {
            slot.classList.add('has-card');
            slot.innerHTML = `
                <div class="card ${card.suit}">
                    <span class="rank">${card.rank}</span>
                    <span class="suit">${SUITS[card.suit].symbol}</span>
                </div>
            `;
        } else {
            slot.classList.remove('has-card');
            slot.innerHTML = `<div class="card-placeholder">${type === 'hand' ? '选择牌' : '公共牌'}</div>`;
        }
    }

    selectHandType(type) {
        // 解析起手牌类型
        const suited = type.endsWith('s');
        const offsuit = type.endsWith('o');
        const ranks = type.replace(/[so]$/, '');
        
        let rank1, rank2;
        if (ranks.length === 2) {
            rank1 = ranks[0];
            rank2 = ranks[1];
        } else {
            // 对子
            rank1 = rank2 = type;
        }

        // 选择花色
        const suits = ['spade', 'heart', 'diamond', 'club'];
        
        if (suited) {
            // 同花
            this.setCard('hand', 0, rank1, suits[0]);
            this.setCard('hand', 1, rank2, suits[0]);
        } else if (offsuit) {
            // 非同花
            this.setCard('hand', 0, rank1, suits[0]);
            this.setCard('hand', 1, rank2, suits[1]);
        } else {
            // 对子
            this.setCard('hand', 0, rank1, suits[0]);
            this.setCard('hand', 1, rank2, suits[1]);
        }
    }

    setCard(type, index, rank, suit) {
        const card = new Card(rank, suit);
        const cardKey = card.toString();

        // 移除旧牌
        const oldCard = this.selectedCards[type][index];
        if (oldCard) {
            this.usedCards.delete(oldCard.toString());
        }

        // 检查是否已被使用
        if (this.usedCards.has(cardKey) && cardKey !== (oldCard ? oldCard.toString() : '')) {
            // 找另一个花色
            const otherSuits = ['spade', 'heart', 'diamond', 'club'].filter(s => s !== suit);
            for (const s of otherSuits) {
                const altCard = new Card(rank, s);
                if (!this.usedCards.has(altCard.toString())) {
                    this.selectedCards[type][index] = altCard;
                    this.usedCards.add(altCard.toString());
                    this.updateCardSlot(type, index, altCard);
                    return;
                }
            }
            return;
        }

        this.selectedCards[type][index] = card;
        this.usedCards.add(cardKey);
        this.updateCardSlot(type, index, card);
    }

    // ====== 分析决策并保存 ======
    analyze() {
        // 验证输入
        const hand = this.selectedCards.hand.filter(c => c !== null);
        if (hand.length < 2) {
            alert('请选择你的两张手牌！');
            return;
        }

        // 验证公共牌
        const requiredCommunity = { flop: 3, turn: 4, river: 5 };
        const communityNeeded = requiredCommunity[this.currentStage] || 0;
        const community = this.selectedCards.community.slice(0, communityNeeded).filter(c => c !== null);

        // 详细验证：检查每个公共牌槽是否都有牌
        if (communityNeeded > 0) {
            for (let i = 0; i < communityNeeded; i++) {
                if (!this.selectedCards.community[i]) {
                    const stageNames = { flop: '翻牌', turn: '转牌', river: '河牌' };
                    alert(`${stageNames[this.currentStage]}阶段需要${communityNeeded}张公共牌！\n\n请完善所有公共牌后再分析。`);
                    // 滚动到公共牌区域并高亮显示
                    document.getElementById('communitySection').scrollIntoView({ behavior: 'smooth' });
                    const missingSlot = document.getElementById(`comm${i + 1}`);
                    missingSlot.classList.add('highlight-missing');
                    setTimeout(() => missingSlot.classList.remove('highlight-missing'), 3000);
                    return;
                }
            }
        }

        // 获取游戏参数
        const players = parseInt(document.getElementById('players').value);
        const pot = parseInt(document.getElementById('pot').value);
        const betToCall = parseInt(document.getElementById('betToCall').value);
        const stack = parseInt(document.getElementById('stack').value);
        const position = document.getElementById('position').value;
        const tightness = document.getElementById('tightness').value;

        // 计算胜率(简化版，使用蒙特卡洛模拟)
        let equity = undefined;  // 翻前阶段为 undefined，翻后通过蒙特卡洛计算
        if (this.currentStage !== 'preflop') {
            try {
                const calcResult = calculateEquity(hand, community, players, 1000);  // 增加模拟次数到1000
                equity = calcResult.equity;
                console.log('蒙特卡洛胜率:', equity);
            } catch (e) {
                console.warn('胜率计算失败，使用默认值', e);
                equity = undefined;
            }
        }

        // 创建决策对象
        const decision = new GTODecision({
            players,
            pot,
            betToCall,
            stack,
            position,
            stage: this.currentStage,
            holeCards: hand,
            communityCards: community,
            equity,
            tightness
        });

        // 获取决策
        const result = decision.getDecision();

        // 保存当前决策信息（用于后续记录结果）
        this.currentDecision = {
            handCards: hand.map(c => ({ rank: c.rank, suit: c.suit })),
            communityCards: community.map(c => ({ rank: c.rank, suit: c.suit })),
            players,
            pot,
            betToCall,
            stack,
            position,
            stage: this.currentStage,
            action: result.action,
            reason: result.reason,
            potOdds: result.potOdds,
            equity: equity,
            handStrength: result.handStrength,
            amount: result.amount,
            tightness: tightness,
            tightnessName: result.tightnessName,
            tightnessDesc: result.tightnessDesc,
            isRandomMode: result.isRandomMode
        };

        // 显示结果
        this.showResult(result, hand, community, equity, pot, betToCall, players);

        // 显示结果输入区域
        document.getElementById('resultInputSection').style.display = 'block';
        // 滚动到决策建议区域，而不是滚动到最后
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showResult(result, hand, community, equity, pot, betToCall, players) {
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');

        // 动作显示
        const actionText = {
            'fold': '弃牌',
            'call': '跟注',
            'raise': '加注',
            'allin': '全押'
        };

        const actionClass = result.action;

        // 计算显示的胜率
        let displayEquityPercent;
        if (equity !== undefined) {
            displayEquityPercent = equity * 100;  // 翻后：使用蒙特卡洛胜率
        } else {
            /* ============================================================
             * 翻前胜率估算公式原理说明
             * ============================================================
             * 
             * 【核心思想】
             * 翻前无法通过模拟计算精确胜率（缺少公共牌），因此采用"起手牌强度→胜率"的映射估算。
             * 
             * 【输入参数】
             * 1. handStrength: 起手牌强度 (20-100)，由 poker.js 中的 getStartingHandRank() 计算
             *    - 对子: 50 + (牌面值-2)×4，例如 AA=100, KK=95, 22=40
             *    - 同花: 20 + 高牌 + 低牌 + 15(连张加成)，例如 AKs=92
             *    - 非同花: 10 + 高牌 + 低牌/2 + 10(连张加成)，例如 AKo=88
             * 
             * 【估算公式】
             * 胜率 = minEquity + (handStrength - 20) × (maxEquity - minEquity) ÷ 80
             * 
             * 其中：
             * - handStrength 映射范围: 20(最弱) → 100(AA)
             * - maxEquity: AA在不同人数局中的实际胜率（查表）
             * - minEquity: 最弱牌的保底胜率
             * 
             * 【关键数据：AA在不同人数局中的胜率】
             * 人数 | 对手数 | AA胜率 | maxEquity
             * -----|--------|--------|----------
             *  2   |   1    |  85%   |   85
             *  3   |   2    |  65%   |   65
             *  4   |   3    |  50%   |   50
             *  5   |   4    |  42%   |   42
             *  6   |   5    |  35%   |   35
             *  7   |   6    |  30%   |   30
             *  8   |   7    |  27%   |   27
             *  9   |   8    |  25%   |   25
             * 10   |   9    |  23%   |   23
             * 
             * 【minEquity 设置逻辑】
             * - 少于3人局(opponents≤2): 12%（翻前最弱牌也有一定胜率）
             * - 3-5人局(opponents≤5): 10%（人数稍多，最弱牌胜率降低）
             * - 6人以上: 8%（多人局最弱牌胜率更低）
             * 
             * 【示例计算】（6人局，AA vs 其他5人）
             * handStrength = 100
             * maxEquity = 35 (6人局AA胜率)
             * minEquity = 8
             * 
             * 胜率 = 8 + (100-20) × (35-8) ÷ 80
             *      = 8 + 80 × 27 ÷ 80
             *      = 8 + 27 = 35% ✓
             * 
             * 【示例计算】（6人局，AQo）
             * handStrength = 78
             * maxEquity = 35
             * minEquity = 8
             * 
             * 胜率 = 8 + (78-20) × (35-8) ÷ 80
             *      = 8 + 58 × 27 ÷ 80
             *      = 8 + 19.6 = 27.6%
             * 
             * 【数学原理】
             * 线性插值公式: y = y1 + (x-x1)×(y2-y1)/(x2-x1)
             * 
             * x1=20(最弱牌)  →  y1=minEquity(最弱胜率)
             * x2=100(AA)    →  y2=maxEquity(AA胜率)
             * x=handStrength → y=估算胜率
             * 
             * 【优缺点】
             * ✓ 优点：计算快速，不需要模拟，翻前阶段足够准确
             * ✗ 缺点：忽略具体对手手牌范围，仅基于手牌强度估算
             * 
             * ============================================================
             */
            
            const handStrength = result.handStrength || 50;

            // 根据对手数量确定AA的最大胜率
            // 单挑(2人): 85%, 3人: 65%, 4人: 50%, 6人: 35%, 9人: 25%
            const opponents = Math.max(1, players - 1);
            let maxEquity;
            if (opponents === 1) {
                maxEquity = 85;  // 单挑
            } else if (opponents === 2) {
                maxEquity = 65;  // 3人局
            } else if (opponents === 3) {
                maxEquity = 50;  // 4人局
            } else if (opponents === 5) {
                maxEquity = 35;  // 6人局
            } else if (opponents >= 8) {
                maxEquity = 25;  // 9人局
            } else {
                // 线性插值
                if (opponents === 4) maxEquity = 42;  // 5人局
                else if (opponents === 6) maxEquity = 30;  // 7人局
                else if (opponents === 7) maxEquity = 27;  // 8人局
                else maxEquity = 35;  // 默认
            }

            // 弱牌的最小胜率也随对手数量调整
            const minEquity = opponents <= 2 ? 12 : (opponents <= 5 ? 10 : 8);

            // 映射：handStrength 100→maxEquity, 20→minEquity
            displayEquityPercent = minEquity + (handStrength - 20) * (maxEquity - minEquity) / (100 - 20);
            displayEquityPercent = Math.max(minEquity, Math.min(maxEquity, displayEquityPercent));
        }

        // 构建结果HTML
        let html = `
            <div class="decision-header">
                <div class="decision-action ${actionClass}">
                    ${actionText[result.action]}
                    ${result.amount > 0 ? `<br><small>${result.amount} 筹码</small>` : ''}
                </div>
                <p class="decision-reason">${result.reason}</p>
                ${result.isRandomMode ? `<p class="random-mode-hint">🎲 李老师儿随机模式 → 本次采用【${result.tightnessName}】风格</p>` : ''}
            </div>

            <div class="hand-strength">
                <span>预估胜率:</span>
                <div class="strength-bar">
                    <div class="strength-fill ${this.getStrengthClass(displayEquityPercent)}"
                         style="width: ${displayEquityPercent}%"></div>
                </div>
                <span class="strength-value">${displayEquityPercent.toFixed(1)}%</span>
            </div>

            <div class="decision-details">
                <div class="detail-card">
                    <h4>底池赔率</h4>
                    <div class="value ${result.potOdds > 0.3 ? 'bad' : 'good'}">
                        ${(result.potOdds * 100).toFixed(1)}%
                    </div>
                </div>
                ${equity ? `
                <div class="detail-card">
                    <h4>预估胜率</h4>
                    <div class="value ${equity > 0.5 ? 'good' : equity > 0.3 ? 'medium' : 'bad'}">
                        ${(equity * 100).toFixed(1)}%
                    </div>
                </div>
                ` : ''}
                ${result.handName ? `
                <div class="detail-card">
                    <h4>当前牌型</h4>
                    <div class="value">${result.handName}</div>
                </div>
                ` : ''}
                <div class="detail-card tightness-card">
                    <h4>决策风格</h4>
                    <div class="value">${result.tightnessName} (${result.tightnessDesc})</div>
                </div>
                ${result.drawStrength && result.drawStrength.type !== '无' ? `
                <div class="detail-card">
                    <h4>听牌类型</h4>
                    <div class="value medium">${result.drawStrength.type}</div>
                </div>
                ` : ''}
            </div>
        `;

        // GTO建议
        html += `
            <div class="action-suggestion">
                <h4>💡 GTO策略建议</h4>
                <p>${this.getGTOSuggestion(result)}</p>
                ${this.getDetailedReason(result, equity, pot, betToCall, players)}
                ${this.getCalculationExplanation(result, pot, betToCall, players)}
            </div>
        `;

        resultContent.innerHTML = html;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    getStrengthClass(strength) {
        if (strength >= 70) return 'strong';
        if (strength >= 40) return 'medium';
        return 'weak';
    }

    getGTOSuggestion(result) {
        const suggestions = {
            'fold': '根据GTO理论，当前情况弃牌是最优选择。保留筹码等待更好的机会，这是长期盈利的关键。',
            'call': '跟注是合理的决定。',
            'raise': '加注显示了牌力，可以实现价值或保护成牌。GTO策略建议在这个位置和牌力下应该积极下注。',
            'allin': '全押是GTO策略的推荐选择。你的牌力足够强，且筹码深度适合现在就获取最大价值。'
        };

        return suggestions[result.action] || '根据当前情况做出最优决策。';
    }

    getDetailedReason(result, equity, pot, betToCall, players) {
        let details = '';

        // 底池赔率分析
        const potOdds = result.potOdds * 100;

        // ✅ 修复：使用 equity（实际胜率）而不是 handStrength（牌型等级）
        // equity 是 0-1 的小数，需要转换为百分比
        // 翻前阶段 equity 是 undefined，需要使用估算的胜率
        let equityPercent;
        if (equity !== undefined) {
            equityPercent = equity * 100;  // 蒙特卡洛计算的胜率，如 76.2%
        } else {
            // 翻前阶段：根据对手数量调整胜率估算
            const handStrength = result.handStrength || 50;
            const opponents = Math.max(1, players - 1);
            let maxEquity;
            if (opponents === 1) maxEquity = 85;
            else if (opponents === 2) maxEquity = 65;
            else if (opponents === 3) maxEquity = 50;
            else if (opponents === 5) maxEquity = 35;
            else if (opponents >= 8) maxEquity = 25;
            else {
                if (opponents === 4) maxEquity = 42;
                else if (opponents === 6) maxEquity = 30;
                else if (opponents === 7) maxEquity = 27;
                else maxEquity = 35;
            }
            const minEquity = opponents <= 2 ? 12 : (opponents <= 5 ? 10 : 8);
            equityPercent = minEquity + (handStrength - 20) * (maxEquity - minEquity) / (100 - 20);
            equityPercent = Math.max(minEquity, Math.min(maxEquity, equityPercent));
        }

        details += `<div class="detail-reason"><strong>📊 底池赔率分析：</strong>`;

        if (result.action === 'call') {
            details += `你的胜率约 ${equityPercent.toFixed(1)}%，需要跟注才能赢取底池中的筹码。`;
            details += `<br><strong>为什么匹配：</strong>`;

            if (equityPercent > potOdds) {
                details += `你的胜率（${equityPercent.toFixed(1)}%）高于底池赔率要求的（${potOdds.toFixed(1)}%），数学上长期跟注是正期望值（+EV）。`;
                if (result.drawStrength && result.drawStrength.type !== '无') {
                    details += `你有${result.drawStrength.type}，听牌成功时胜率会大幅提升，进一步增加了跟注的价值。`;
                }
            } else if (equityPercent > potOdds - 15) {
                details += `你的胜率（${equityPercent.toFixed(1)}%）接近底池赔率要求的（${potOdds.toFixed(1)}%），考虑隐含赔率（后续可能赢得的额外筹码），跟注是合理的选择。`;
            } else {
                details += `虽然你的胜率略低，但考虑位置优势和隐含赔率，跟注控制底池是明智的。`;
            }
        } else if (result.action === 'raise') {
            details += `你的胜率（${equityPercent.toFixed(1)}%）明显高于底池赔率要求，通过加注可以：`;
            details += `<br>• 获取价值：让 weaker hands 支付更多来看牌`;
            details += `<br>• 保护成牌：驱逐对手的听牌`;
            details += `<br>• 框住范围：让对手难以读取你的牌力`;
        } else if (result.action === 'fold') {
            details += `底池赔率要求（${potOdds.toFixed(1)}%）远高于你的实际胜率（${equityPercent.toFixed(1)}%），长期跟注是负期望值（-EV），弃牌能避免损失。`;
        } else if (result.action === 'allin') {
            details += `你的胜率（${equityPercent.toFixed(1)}%）足够高且筹码深度适合，全押可以一次性获取最大价值，防止对手看到便宜牌。`;
        }

        details += `</div>`;

        return details;
    }

    getCalculationExplanation(result, pot, betToCall, players) {
        // 计算详细的计算方法说明
        let explanation = '<div class="calculation-explanation">';

        explanation += '<h4>📐 计算方法说明</h4>';

        // 1. 底池赔率计算
        explanation += '<div class="calc-item">';
        explanation += '<strong>1. 底池赔率计算：</strong><br>';
        explanation += `<div class="formula">`;
        explanation += `底池赔率 = 需跟注金额 ÷ (底池金额 + 需跟注金额)<br>`;
        explanation += `= ${betToCall} ÷ (${pot} + ${betToCall})<br>`;
        explanation += `= ${(betToCall / (pot + betToCall)).toFixed(4)} = ${(result.potOdds * 100).toFixed(1)}%`;
        explanation += `</div>`;
        explanation += '<small>说明：底池赔率表示你需要至少多少胜率才能跟注不亏损。</small>';
        explanation += '</div>';

        // 2. 预估胜率计算
        explanation += '<div class="calc-item">';
        explanation += '<strong>2. 预估胜率计算：</strong><br>';
        if (result.equity !== undefined) {
            explanation += `<div class="formula">`;
            explanation += `使用蒙特卡洛模拟计算<br>`;
            explanation += `模拟次数：1000次<br>`;
            explanation += `对手数量：${players || '根据设置'}<br>`;
            explanation += `胜率 = ${result.equity.toFixed(4)} = ${(result.equity * 100).toFixed(1)}%`;
            explanation += `</div>`;
            explanation += '<small>说明：通过随机模拟剩余公共牌和对手手牌，计算你的获胜概率。</small>';
        } else {
            const handStrength = result.handStrength || 50;
            const opponents = Math.max(1, players - 1);
            let maxEquity;
            if (opponents === 1) maxEquity = 85;
            else if (opponents === 2) maxEquity = 65;
            else if (opponents === 3) maxEquity = 50;
            else if (opponents === 5) maxEquity = 35;
            else if (opponents >= 8) maxEquity = 25;
            else {
                if (opponents === 4) maxEquity = 42;
                else if (opponents === 6) maxEquity = 30;
                else if (opponents === 7) maxEquity = 27;
                else maxEquity = 35;
            }
            const minEquity = opponents <= 2 ? 12 : (opponents <= 5 ? 10 : 8);
            const preflopEquity = minEquity + (handStrength - 20) * (maxEquity - minEquity) / (100 - 20);
            const clampedEquity = Math.max(minEquity, Math.min(maxEquity, preflopEquity));
            explanation += `<div class="formula">`;
            explanation += `翻前阶段胜率估算（${players}人局）<br>`;
            explanation += `起手牌强度 = ${handStrength}（满分100，AA为100）<br>`;
            explanation += `对手数量 = ${opponents}人<br>`;
            explanation += `估算公式：${minEquity}% + (强度-20) × (${maxEquity}-${minEquity}%) ÷ 80<br>`;
            explanation += `估算胜率 = ${clampedEquity.toFixed(1)}%<br>`;
            explanation += `（此${players}人局中：AA约${maxEquity}%，弱牌约${minEquity}%）`;
            explanation += `</div>`;
            explanation += `<small>说明：翻前胜率随对手数量变化。单挑AA约85%，6人局AA约35%，9人局AA约25%。</small>`;
        }
        explanation += '</div>';

        // 3. 当前牌型强度计算
        explanation += '<div class="calc-item">';
        explanation += '<strong>3. 当前牌型强度：</strong><br>';
        explanation += `<div class="formula">`;
        if (result.handName) {
            // 翻后：显示牌型等级
            explanation += `牌型：${result.handName}<br>`;
            explanation += `强度等级：${result.handStrength ? result.handStrength.toFixed(1) : 'N/A'}/9<br>`;
            explanation += `（9 = 皇家同花顺，0 = 高牌）`;
        } else {
            // 翻前：显示起手牌强度
            explanation += `起手牌强度：${result.handStrength ? result.handStrength.toFixed(1) : 'N/A'}/100<br>`;
            explanation += `（100 = AA，95 = KK，92 = AKs等）`;
        }
        explanation += `</div>`;
        explanation += '<small>说明：</small><br>';
        if (result.handName) {
            explanation += '<small class="strength-scale">';
            explanation += '• 一对(1) → 两对(2) → 三条(3) → 顺子(4) → 同花(5)<br>';
            explanation += '• 葫芦(6) → 四条(7) → 同花顺(8) → 皇家同花顺(9)';
            explanation += '</small>';
        } else {
            explanation += '<small class="strength-scale">';
            explanation += '翻前起手牌强度范围：20-100<br>';
            explanation += '• 对子：AA(100) - 22(40)<br>';
            explanation += '• 高牌组合：AKs(92) - 72o(20)';
            explanation += '</small>';
        }
        explanation += '</div>';

        // 4. 决策逻辑
        explanation += '<div class="calc-item">';
        explanation += '<strong>4. 决策逻辑：</strong><br>';
        explanation += `<div class="formula">`;
        if (result.equity !== undefined) {
            const equityPercent = result.equity * 100;
            const potOddsPercent = result.potOdds * 100;
            if (equityPercent > potOddsPercent) {
                explanation += `✅ 胜率(${equityPercent.toFixed(1)}%) > 底池赔率(${potOddsPercent.toFixed(1)}%) → 跟注是+EV<br>`;
            } else if (equityPercent > potOddsPercent - 15) {
                explanation += `⚠️ 胜率(${equityPercent.toFixed(1)}%) ≈ 底池赔率(${potOddsPercent.toFixed(1)}%) → 考虑隐含赔率跟注<br>`;
            } else {
                explanation += `❌ 胜率(${equityPercent.toFixed(1)}%) < 底池赔率(${potOddsPercent.toFixed(1)}%) → 弃牌避免亏损`;
            }
        } else {
            const handStrength = result.handStrength || 50;
            const opponents = Math.max(1, players - 1);
            let maxEquity;
            if (opponents === 1) maxEquity = 85;
            else if (opponents === 2) maxEquity = 65;
            else if (opponents === 3) maxEquity = 50;
            else if (opponents === 5) maxEquity = 35;
            else if (opponents >= 8) maxEquity = 25;
            else {
                if (opponents === 4) maxEquity = 42;
                else if (opponents === 6) maxEquity = 30;
                else if (opponents === 7) maxEquity = 27;
                else maxEquity = 35;
            }
            const minEquity = opponents <= 2 ? 12 : (opponents <= 5 ? 10 : 8);
            const preflopEquity = minEquity + (handStrength - 20) * (maxEquity - minEquity) / (100 - 20);
            const clampedEquity = Math.max(minEquity, Math.min(maxEquity, preflopEquity));
            const potOddsPercent = result.potOdds * 100;
            explanation += `翻前阶段胜率估算（${players}人局）：${clampedEquity.toFixed(1)}%<br>`;
            if (clampedEquity > potOddsPercent) {
                explanation += `✅ 估算胜率 > 底池赔率(${potOddsPercent.toFixed(1)}%) → 跟注/加注<br>`;
            } else {
                explanation += `⚠️ 根据起手牌范围表和位置优势做决策`;
            }
        }
        explanation += `</div>`;
        explanation += '<small>说明：+EV表示正期望值，长期执行此策略会盈利；-EV表示负期望值，长期会亏损。</small>';
        explanation += '</div>';

        // 5. 风格分析
        explanation += '<div class="calc-item">';
        explanation += '<strong>5. 风格分析：</strong><br>';
        explanation += `<div class="formula">`;
        
        // 获取风格配置
        const tightnessConfig = this.getTightnessConfig(result.tightness);
        
        explanation += `当前风格：<strong>${result.tightnessName}</strong> (${result.tightnessDesc})<br><br>`;
        
        if (result.isRandomMode) {
            explanation += `🎲 <em>李老师儿随机模式 - 本次随机采用了【${result.tightnessName}】风格</em><br><br>`;
        }
        
        explanation += `<u>决策参数：</u><br>`;
        explanation += `• Raise阈值：${(tightnessConfig.raiseThreshold * 100).toFixed(0)}%（胜率超过此值才考虑raise）<br>`;
        explanation += `• Call阈值：${(tightnessConfig.callThreshold * 100).toFixed(0)}%（胜率超过此值才考虑call）<br>`;
        explanation += `• 加注倍数：${tightnessConfig.raiseMultiplier}bet<br>`;
        explanation += `• 胜率调整：${tightnessConfig.equityThreshold >= 0 ? '+' : ''}${(tightnessConfig.equityThreshold * 100).toFixed(0)}%（松的风格降低胜率要求，紧的风格提高）<br><br>`;
        
        explanation += `<u>风格特点：</u><br>`;
        explanation += this.getTightnessDescription(result.tightness, tightnessConfig);
        
        explanation += `</div>`;
        explanation += '<small>说明：松紧度影响决策激进程度，选择适合自己风格的策略可提高舒适度和执行力。</small>';
        explanation += '</div>';

        explanation += '</div>';

        return explanation;
    }

    // 获取松紧度配置
    getTightnessConfig(tightness) {
        const configs = {
            'huangshang': {
                name: '皇上',
                level: 5,
                description: '很松 - 最激进',
                equityThreshold: -0.15,
                raiseThreshold: 0.25,
                callThreshold: 0.15,
                raiseMultiplier: 5.0
            },
            'shiwei': {
                name: '世伟',
                level: 4,
                description: '松 - 激进',
                equityThreshold: -0.10,
                raiseThreshold: 0.30,
                callThreshold: 0.20,
                raiseMultiplier: 3.0
            },
            'longer': {
                name: '龙儿',
                level: 3,
                description: '一般 - 平衡',
                equityThreshold: 0,
                raiseThreshold: 0.40,
                callThreshold: 0.25,
                raiseMultiplier: 2.5
            },
            'jiaman': {
                name: '嘉蔓',
                level: 2,
                description: '紧 - 谨慎',
                equityThreshold: 0.10,
                raiseThreshold: 0.55,
                callThreshold: 0.35,
                raiseMultiplier: 2.0
            },
            'shicheng': {
                name: '仕丞',
                level: 1,
                description: '很紧 - 极谨慎',
                equityThreshold: 0.20,
                raiseThreshold: 0.80,
                callThreshold: 0.50,
                raiseMultiplier: 2.0
            }
        };
        return configs[tightness] || configs['longer'];
    }

    // 获取风格描述
    getTightnessDescription(tightness, config) {
        const descriptions = {
            'huangshang': `🔴 <strong>最激进风格</strong><br>
                • 只需25%胜率就敢于raise，5bet加注非常激进<br>
                • 起手牌范围极宽，经常用边缘牌施压<br>
                • 适合碾压弱对手、积累筹码、建立激进形象<br>
                • 风险：遇到强牌容易被反打，需要良好的读牌能力`,
            
            'shiwei': `🟠 <strong>激进风格</strong><br>
                • 30%胜率就开始raise，3bet加注<br>
                • 起手牌范围较宽，愿意用中等牌施压<br>
                • 适合对抗被动对手、积累筹码<br>
                • 风险：需要控制诈唬频率，避免被紧凶玩家反制`,
            
            'longer': `🟡 <strong>平衡风格</strong><br>
                • 标准的GTO风格，40%胜率raise<br>
                • 起手牌范围适中，兼顾价值下注和诈唬<br>
                • 适合大多数场景，风险收益平衡<br>
                • 建议：初学者和中级玩家的首选风格`,
            
            'jiaman': `🟢 <strong>谨慎风格</strong><br>
                • 需要55%胜率才raise，只打有把握的牌<br>
                • 起手牌范围较紧，避免边缘决策<br>
                • 适合保住筹码、对抗激进对手<br>
                • 风险：可能错过一些+EV的边缘机会`,
            
            'shicheng': `🔵 <strong>极谨慎风格</strong><br>
                • 需要80%胜率才raise，几乎只用坚果牌<br>
                • 起手牌范围极紧，只玩最强牌<br>
                • 适合保住筹码、避免大起大落<br>
                • 风险：容易被对手读取牌力，错过很多盈利机会`
        };
        return descriptions[tightness] || descriptions['longer'];
    }

    updatePositionOptions() {
        const playerCount = parseInt(document.getElementById('players').value) || 6;
        const positionSelect = document.getElementById('position');
        const currentValue = positionSelect.value;

        // 根据人数定义位置
        const positions = {
            2: [
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            3: [
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            4: [
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            5: [
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            6: [
                { value: 'mp', label: 'MP (中间位)' },
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            7: [
                { value: 'utg', label: 'UTG (枪口位)' },
                { value: 'mp', label: 'MP (中间位)' },
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            8: [
                { value: 'utg', label: 'UTG (枪口位)' },
                { value: 'utg1', label: 'UTG+1' },
                { value: 'mp', label: 'MP (中间位)' },
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            9: [
                { value: 'utg', label: 'UTG (枪口位)' },
                { value: 'utg1', label: 'UTG+1' },
                { value: 'utg2', label: 'UTG+2' },
                { value: 'mp', label: 'MP (中间位)' },
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ],
            10: [
                { value: 'utg', label: 'UTG (枪口位)' },
                { value: 'utg1', label: 'UTG+1' },
                { value: 'utg2', label: 'UTG+2' },
                { value: 'utg3', label: 'UTG+3' },
                { value: 'mp', label: 'MP (中间位)' },
                { value: 'hj', label: 'HJ (劫持位)' },
                { value: 'co', label: 'CO (关煞位)' },
                { value: 'btn', label: 'BTN (庄家位)' },
                { value: 'sb', label: 'SB (小盲位)' },
                { value: 'bb', label: 'BB (大盲位)' }
            ]
        };

        // 生成选项HTML
        const availablePositions = positions[playerCount] || positions[6];
        positionSelect.innerHTML = availablePositions.map((pos, index) =>
            `<option value="${pos.value}" ${index === availablePositions.length - 3 ? 'selected' : ''}>${pos.label}</option>`
        ).join('');

        // 尝试保留之前的选择（如果仍可用）
        if (availablePositions.find(p => p.value === currentValue)) {
            positionSelect.value = currentValue;
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PokerApp();
    initPWA();
});

// ====== PWA 安装功能 ======
let deferredPrompt;

function initPWA() {
    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 检查是否已经安装过或用户已关闭提示
        const installDismissed = localStorage.getItem('installDismissed');
        const installDate = localStorage.getItem('installDate');
        
        // 如果用户之前关闭过提示，7天后再显示
        if (installDismissed === 'true') {
            const dismissedTime = parseInt(installDate) || 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }
        
        // 显示安装提示
        setTimeout(() => {
            document.getElementById('installPrompt').style.display = 'block';
        }, 3000);
    });

    // 安装按钮点击
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('用户接受了安装');
                localStorage.setItem('installDismissed', 'false');
            }
            
            deferredPrompt = null;
            document.getElementById('installPrompt').style.display = 'none';
        }
    });

    // 关闭安装提示
    document.getElementById('installDismiss').addEventListener('click', () => {
        document.getElementById('installPrompt').style.display = 'none';
        localStorage.setItem('installDismissed', 'true');
        localStorage.setItem('installDate', Date.now().toString());
    });

    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
        console.log('PWA 安装成功！');
        document.getElementById('installPrompt').style.display = 'none';
        localStorage.setItem('installDismissed', 'false');
    });

    // iOS Safari 安装提示
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isInStandaloneMode = 'standalone' in window.navigator && window.navigator.standalone;
    
    if (isIos && !isInStandaloneMode) {
        const iosInstallDismissed = localStorage.getItem('iosInstallDismissed');
        const iosInstallDate = localStorage.getItem('iosInstallDate');
        
        if (iosInstallDismissed === 'true') {
            const dismissedTime = parseInt(iosInstallDate) || 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }
        
        // 显示 iOS 安装提示
        setTimeout(() => {
            showIosInstallPrompt();
        }, 3000);
    }
}

function showIosInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'ios-install-prompt';
    prompt.innerHTML = `
        <div class="ios-install-content">
            <button class="ios-install-close" onclick="this.parentElement.parentElement.remove(); localStorage.setItem('iosInstallDismissed', 'true'); localStorage.setItem('iosInstallDate', Date.now().toString());">×</button>
            <div class="ios-install-icon">📱</div>
            <div class="ios-install-text">
                <strong>安装到主屏幕</strong>
                <p>点击 <span class="share-icon">⎙</span> 分享按钮<br>然后选择"添加到主屏幕"</p>
            </div>
        </div>
    `;
    document.body.appendChild(prompt);
}
