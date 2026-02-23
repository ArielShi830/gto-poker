// GTO决策算法

// 位置权重
const POSITION_WEIGHTS = {
    'utg': 0.7,   // 枪口位需要更强牌
    'utg1': 0.75,
    'mp': 0.8,
    'hj': 0.9,
    'co': 1.0,    // 关煞位
    'btn': 1.1,   // 庄家位最优
    'sb': 0.85,
    'bb': 0.95
};

// 松紧度配置
const TIGHTNESS_CONFIG = {
    'huangshang': {  // 皇上 - 很松，最激进
        name: '皇上',
        level: 5,  // 最松
        description: '很松 - 最激进',
        // 决策阈值调整
        equityThreshold: -0.15,    // 胜率要求降低15%
        raiseThreshold: 0.25,      // 25%胜率就raise
        callThreshold: 0.15,       // 15%胜率就跟注
        raiseMultiplier: 5.0,      // 5bet
        // 翻前调整
        preflopRangeBonus: 25,     // 起手牌范围扩大25分
        threeBetRange: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'A9s', 'KQs', 'KQo', 'KJs', 'QJs', 'JTs']
    },
    'shiwei': {  // 世伟 - 松，激进
        name: '世伟',
        level: 4,
        description: '松 - 激进',
        equityThreshold: -0.10,
        raiseThreshold: 0.30,
        callThreshold: 0.20,
        raiseMultiplier: 3.0,      // 3bet
        preflopRangeBonus: 15,
        threeBetRange: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs', 'KQo']
    },
    'longer': {  // 龙儿 - 一般，平衡（默认）
        name: '龙儿',
        level: 3,
        description: '一般 - 平衡',
        equityThreshold: 0,
        raiseThreshold: 0.40,
        callThreshold: 0.25,
        raiseMultiplier: 2.5,
        preflopRangeBonus: 0,
        threeBetRange: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']
    },
    'jiaman': {  // 嘉蔓 - 紧，谨慎
        name: '嘉蔓',
        level: 2,
        description: '紧 - 谨慎',
        equityThreshold: 0.10,
        raiseThreshold: 0.55,
        callThreshold: 0.35,
        raiseMultiplier: 2.0,
        preflopRangeBonus: -15,
        threeBetRange: ['AA', 'KK', 'QQ', 'AKs']
    },
    'shicheng': {  // 仕丞 - 很紧，极谨慎
        name: '仕丞',
        level: 1,
        description: '很紧 - 极谨慎',
        equityThreshold: 0.20,
        raiseThreshold: 0.80,      // 需要80%胜率才raise
        callThreshold: 0.50,       // 需要50%胜率才跟注
        raiseMultiplier: 2.0,
        preflopRangeBonus: -30,
        threeBetRange: ['AA', 'KK']  // 只用AA/KK 3bet
    }
};

// 翻前起手牌范围表(根据位置)
const PREFLOP_RANGES = {
    'utg': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'],
        'call': ['TT', '99', 'AJo', 'KQo', 'ATs', 'KJs', 'QJs'],
        'fold': '其他'
    },
    'mp': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'KQs', 'KQo'],
        'call': ['99', '88', 'AJo', 'ATo', 'KJs', 'QJs', 'JTs', 'T9s'],
        'fold': '其他'
    },
    'co': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'AJo', 'ATo', 
                  'KQs', 'KQo', 'KJs', 'KJo', 'QJs', 'QJo', 'JTs', 'T9s'],
        'call': ['88', '77', '66', 'A9s', 'A8s', 'KTs', 'QTs', 'J9s', '98s'],
        'fold': '其他'
    },
    'btn': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 
                  'A9s', 'A8s', 'A7s', 'AJo', 'ATo', 'A9o', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'KTo',
                  'QJs', 'QJo', 'QTs', 'JTs', 'JTo', 'T9s', '98s', '87s'],
        'call': ['66', '55', '44', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'K9s', 'Q9s', 'J9s', 'T8s', '97s', '86s'],
        'fold': '其他'
    },
    'sb': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'AJo', 'KQs', 'KQo'],
        'call': ['99', '88', '77', 'ATo', 'KJs', 'KJo', 'QJs', 'QTs', 'JTs'],
        'fold': '其他'
    },
    'bb': {
        'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs', 'AJo', 'ATo', 'KQs', 'KQo'],
        'call': ['99', '88', '77', '66', 'A9s', 'A8s', 'A7s', 'KJs', 'KJo', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s'],
        'fold': '其他'
    }
};

// 默认范围(未指定位置时使用)
const DEFAULT_RANGE = {
    'raise': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo'],
    'call': ['99', '88', 'AJs', 'ATs', 'KQs', 'KQo'],
    'fold': '其他'
};

class GTODecision {
    constructor(params) {
        this.players = params.players;
        this.pot = params.pot;
        this.betToCall = params.betToCall;
        this.stack = params.stack;
        this.position = params.position;
        this.stage = params.stage;
        this.holeCards = params.holeCards;
        this.communityCards = params.communityCards || [];
        this.equity = params.equity;
        this.tightness = params.tightness || 'longer';  // 默认龙儿（一般）
        
        // 处理随机模式
        if (this.tightness === 'lilaoshi') {
            const modes = ['huangshang', 'shiwei', 'longer', 'jiaman', 'shicheng'];
            this.tightness = modes[Math.floor(Math.random() * modes.length)];
            this.isRandomMode = true;
        } else {
            this.isRandomMode = false;
        }
        
        this.tightnessConfig = TIGHTNESS_CONFIG[this.tightness] || TIGHTNESS_CONFIG['longer'];
    }

    // 获取决策
    getDecision() {
        switch (this.stage) {
            case 'preflop':
                return this.preflopDecision();
            case 'flop':
                return this.postflopDecision();
            case 'turn':
                return this.postflopDecision();
            case 'river':
                return this.riverDecision();
            default:
                return this.preflopDecision();
        }
    }

    // 翻前决策
    preflopDecision() {
        const handKey = this.getHandKey();
        const positionRange = PREFLOP_RANGES[this.position] || DEFAULT_RANGE;
        const handRank = getStartingHandRank(this.holeCards[0], this.holeCards[1]);
        const positionWeight = POSITION_WEIGHTS[this.position] || 0.8;
        const config = this.tightnessConfig;
        
        // 计算调整后的手牌强度 - 应用松紧度加成
        const adjustedRank = handRank * positionWeight + config.preflopRangeBonus;
        
        // 底池赔率
        const potOdds = this.betToCall > 0 ? this.betToCall / (this.pot + this.betToCall) : 0;
        
        let action, amount, reason;
        
        // 根据松紧度调整的阈值
        const strongHandThreshold = 85 - (config.level - 3) * 10;  // 皇上75, 仕丞95
        const mediumHandThreshold = 60 - (config.level - 3) * 10;  // 皇上50, 仕丞70
        
        // 检查是否在加注范围（考虑松紧度）
        const inRaiseRange = positionRange.raise.includes(handKey) || adjustedRank >= strongHandThreshold;
        const inCallRange = positionRange.call.includes(handKey) || adjustedRank >= mediumHandThreshold;
        const inThreeBetRange = config.threeBetRange && config.threeBetRange.includes(handKey);
        
        if (inRaiseRange) {
            // 是否应该3-bet或更激进
            if (this.betToCall === 0) {
                // 开局加注 - 根据手牌强度动态调整
                action = 'raise';
                const raiseMultiplier = config.raiseMultiplier;
                if (adjustedRank >= 95) {
                    amount = this.calculateRaise(3.5 * (raiseMultiplier / 2.5));
                    reason = `[${config.name}] 超强牌 ${handKey}，开局大额加注`;
                } else if (adjustedRank >= strongHandThreshold) {
                    amount = this.calculateRaise(3.0 * (raiseMultiplier / 2.5));
                    reason = `[${config.name}] 强牌 ${handKey}，开局加注`;
                } else {
                    amount = this.calculateRaise(2.5 * (raiseMultiplier / 2.5));
                    reason = `[${config.name}] 好牌 ${handKey}，位置${this.getPositionName()}，开局加注`;
                }
            } else {
                // 面对(open)加注
                if (inThreeBetRange || adjustedRank >= strongHandThreshold) {
                    action = 'raise'; // 3-bet
                    amount = this.calculateRaise(config.raiseMultiplier);
                    reason = `[${config.name}] ${handKey}，${config.raiseMultiplier}bet加注`;
                } else if (inRaiseRange || adjustedRank >= mediumHandThreshold) {
                    if (config.level >= 3 || adjustedRank >= strongHandThreshold - 10) {
                        action = 'call';
                        amount = this.betToCall;
                        reason = `[${config.name}] 好牌 ${handKey}，跟注看翻牌`;
                    } else {
                        action = 'fold';
                        amount = 0;
                        reason = `[${config.name}] 牌力不足以跟注，弃牌`;
                    }
                } else {
                    action = 'fold';
                    amount = 0;
                    reason = `[${config.name}] 牌力不足，弃牌`;
                }
            }
        }
        // 检查是否在跟注范围
        else if (positionRange.call.includes(handKey) || adjustedRank >= 50) {
            if (potOdds <= 0.3 || this.betToCall === 0) {
                action = this.betToCall === 0 ? 'call' : 'call';
                amount = this.betToCall;
                reason = `中等牌力 ${handKey}，底池赔率合适，跟注`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `中等牌力 ${handKey}，但底池赔率不佳，弃牌`;
            }
        }
        // 弱牌
        else {
            if (this.betToCall === 0 && adjustedRank >= 35) {
                // 偷盲位置
                if (this.position === 'btn' || this.position === 'co' || this.position === 'sb') {
                    action = 'raise';
                    amount = this.calculateRaise(2.2);  // 偷盲2.2倍
                    reason = `位置有利，可以尝试偷盲`;
                } else {
                    action = 'call';
                    amount = 0;
                    reason = `边缘牌，过牌看牌`;
                }
            } else if (this.betToCall === 0) {
                action = 'call';
                amount = 0;
                reason = `弱牌过牌`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `牌力不足 ${handKey}，弃牌`;
            }
        }

        // 考虑筹码深度 - 如果加注额超过筹码的一半且牌力很强，直接全押
        if (amount > this.stack * 0.5 && action === 'raise' && adjustedRank >= 85) {
            action = 'allin';
            amount = this.stack;
            reason = `筹码较浅且牌力强 ${handKey}，直接全押`;
        }

        return {
            action,
            amount,
            handRank,
            adjustedRank,
            potOdds,
            reason,
            handStrength: handRank,  // 使用原始手牌强度，不超过100
            tightness: this.tightness,
            tightnessName: config.name,
            tightnessDesc: config.description,
            isRandomMode: this.isRandomMode
        };
    }

    // 翻后决策
    postflopDecision() {
        const equity = this.equity || 0;  // 翻后如果没有equity，使用0而不是0.5
        const potOdds = this.betToCall > 0 ? this.betToCall / (this.pot + this.betToCall) : 0;
        const handStrength = this.evaluateHandStrength();
        const config = this.tightnessConfig;

        let action, amount, reason;
        
        // 计算期望值
        const evCall = equity * this.pot - (1 - equity) * this.betToCall;
        const evFold = 0;
        
        // 应用松紧度调整后的胜率阈值
        const adjustedEquity = equity + config.equityThreshold;
        const raiseThreshold = config.raiseThreshold;
        const callThreshold = config.callThreshold;
        
        // 决策树 - 根据牌力等级动态调整下注量
        if (handStrength.rank >= 8) { // 同花顺或更强
            action = 'raise';
            amount = this.calculateValueBet(1.2);  // 超强牌下注1.2倍底池
            reason = `超强成牌 ${handStrength.name}，大额价值下注获取最大收益`;
        }
        else if (handStrength.rank >= 7) { // 四条
            action = 'raise';
            amount = this.calculateValueBet(1.0);  // 四条下注满底池
            reason = `四条 ${handStrength.name}，大额下注`;
        }
        else if (handStrength.rank >= 6) { // 葫芦
            action = 'raise';
            amount = this.calculateValueBet(0.85);  // 葫芦下注0.85倍底池
            reason = `强成牌 ${handStrength.name}，大额价值下注`;
        }
        else if (handStrength.rank >= 5) { // 同花
            // 根据胜率调整下注量
            if (equity >= 0.7) {
                action = 'raise';
                amount = this.calculateValueBet(0.75);  // 超强同花0.75倍底池
                reason = `同花（胜率${(equity*100).toFixed(0)}%），大额价值下注`;
            } else {
                action = 'raise';
                amount = this.calculateValueBet(0.66);  // 普通同花0.66倍底池
                reason = `成牌 ${handStrength.name}，价值下注`;
            }
        }
        else if (handStrength.rank >= 4) { // 顺子
            if (this.betToCall === 0) {
                if (equity >= 0.65) {
                    action = 'raise';
                    amount = this.calculateValueBet(0.75);  // 强顺子0.75倍底池
                    reason = `强顺子（胜率${(equity*100).toFixed(0)}%），大额价值下注`;
                } else {
                    action = 'raise';
                    amount = this.calculateValueBet(0.6);  // 普通顺子0.6倍底池
                    reason = `成牌 ${handStrength.name}，价值下注`;
                }
            } else if (equity >= potOdds + 0.1) {  // 胜率明显高于底池赔率
                action = 'raise';
                amount = this.calculateRaise(2.5);  // 加注2.5倍
                reason = `成牌 ${handStrength.name}，胜率明显优势，加注`;
            } else if (equity >= potOdds) {
                action = 'raise';
                amount = this.calculateRaise(2.2);  // 轻微加注
                reason = `成牌 ${handStrength.name}，小幅加注`;
            } else {
                action = 'call';
                amount = this.betToCall;
                reason = `${handStrength.name}，跟注看下一张`;
            }
        }
        else if (handStrength.rank >= 3) { // 三条
            if (this.betToCall === 0) {
                // 根据是否为顶三条调整
                if (equity >= 0.6) {
                    action = 'raise';
                    amount = this.calculateValueBet(0.7);  // 顶三条0.7倍底池
                    reason = `三条（胜率${(equity*100).toFixed(0)}%），大额下注`;
                } else {
                    action = 'raise';
                    amount = this.calculateValueBet(0.55);  // 普通三条0.55倍底池
                    reason = `三条，中等成牌下注`;
                }
            } else {
                action = 'call';
                amount = this.betToCall;
                reason = `三条，跟注`;
            }
        }
        else if (handStrength.rank >= 2) { // 两对
            if (this.betToCall === 0) {
                if (equity >= 0.55) {
                    action = 'raise';
                    amount = this.calculateValueBet(0.65);  // 强两对0.65倍底池
                    reason = `两对（胜率${(equity*100).toFixed(0)}%），中等下注`;
                } else {
                    action = 'raise';
                    amount = this.calculateValueBet(0.5);  // 普通两对0.5倍底池
                    reason = `两对，中等成牌，适度下注`;
                }
            } else if (equity >= potOdds && this.betToCall <= this.pot * 0.6) {
                action = 'call';
                amount = this.betToCall;
                reason = `两对，跟注控制底池`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `两对但面对大下注，弃牌`;
            }
        }
        else if (handStrength.rank === 1) { // 一对
            if (handStrength.topPair) {
                if (equity >= 0.7) {  // 顶对且有高踢脚
                    if (this.betToCall === 0) {
                        action = 'raise';
                        amount = this.calculateValueBet(0.7);  // 强顶对0.7倍底池
                        reason = `顶对（胜率${(equity*100).toFixed(0)}%），价值下注`;
                    } else if (equity >= potOdds + 0.15) {
                        action = 'raise';
                        amount = this.calculateRaise(2.2);  // 有优势时加注
                        reason = `顶对，胜率优势，加注`;
                    } else {
                        action = 'call';
                        amount = this.betToCall;
                        reason = `顶对，跟注`;
                    }
                } else if (equity >= 0.55) {  // 普通顶对
                    if (this.betToCall === 0) {
                        action = 'raise';
                        amount = this.calculateValueBet(0.5);  // 顶对0.5倍底池
                        reason = `顶对，价值下注`;
                    } else if (equity >= potOdds) {
                        action = 'call';
                        amount = this.betToCall;
                        reason = `顶对，底池赔率合适`;
                    } else {
                        action = 'fold';
                        amount = 0;
                        reason = `顶对但赔率不佳`;
                    }
                } else {  // 弱顶对
                    if (this.betToCall === 0) {
                        action = 'call';
                        amount = 0;
                        reason = `弱顶对，过牌`;
                    } else if (this.betToCall <= this.pot * 0.3) {
                        action = 'call';
                        amount = this.betToCall;
                        reason = `顶对，跟注小下注`;
                    } else {
                        action = 'fold';
                        amount = 0;
                        reason = `顶对不足以跟注`;
                    }
                }
            } else {  // 非顶对
                if (this.betToCall === 0) {
                    action = 'call';
                    amount = 0;
                    reason = `非顶对，过牌`;
                } else if (equity >= potOdds && this.betToCall <= this.pot * 0.25) {
                    action = 'call';
                    amount = this.betToCall;
                    reason = `一对，底池赔率合适`;
                } else {
                    action = 'fold';
                    amount = 0;
                    reason = `一对不足以跟注`;
                }
            }
        }
        else { // 高牌或听牌
            const drawStrength = this.evaluateDraws();
            
            if (drawStrength.hasFlushDraw || drawStrength.hasOESD) {
                // 听牌
                const drawEquity = drawStrength.equity;
                if (this.betToCall === 0) {
                    // 根据听牌强度调整半诈唬金额，并应用松紧度
                    if (drawStrength.hasFlushDraw && drawStrength.hasOESD) {
                        action = 'raise';
                        amount = this.calculateValueBet(0.65);  // 组合听牌半诈唬0.65倍底池
                        reason = `组合听牌（胜率${(drawEquity*100).toFixed(0)}%），半诈唬下注`;
                    } else if (drawStrength.hasFlushDraw) {
                        action = 'raise';
                        amount = this.calculateValueBet(0.55);  // 同花听牌0.55倍底池
                        reason = `同花听牌（胜率${(drawEquity*100).toFixed(0)}%），半诈唬下注`;
                    } else {
                        action = 'raise';
                        amount = this.calculateValueBet(0.5);  // 顺子听牌0.5倍底池
                        reason = `听牌(${drawStrength.type})，半诈唬下注`;
                    }
                } else if (drawEquity >= potOdds) {
                    action = 'call';
                    amount = this.betToCall;
                    reason = `听牌(${drawStrength.type}，胜率${(drawEquity*100).toFixed(0)}%)，底池赔率合适`;
                } else {
                    action = 'fold';
                    amount = 0;
                    reason = `听牌赔率不佳`;
                }
            }
            else if (this.betToCall === 0) {
                // 位置优势下注 - 根据松紧度调整
                const positionWeight = POSITION_WEIGHTS[this.position] || 0.8;
                // 松的玩家更倾向于诈唬，紧的玩家更保守
                const bluffProbability = 0.4 + (config.level - 3) * 0.15;  // 皇上0.7, 仕丞0.1
                if (positionWeight >= 1.0 && Math.random() < bluffProbability) {
                    action = 'raise';
                    amount = this.calculateBet(0.33);
                    reason = `位置优势，持续下注(C-bet)`;
                } else {
                    action = 'call';
                    amount = 0;
                    reason = `无成牌，过牌`;
                }
            }
            else {
                // 无成牌无听牌，根据松紧度决定
                if (adjustedEquity >= callThreshold) {
                    action = 'call';
                    amount = this.betToCall;
                    reason = `无成牌但风格激进，尝试跟注`;
                } else {
                    action = 'fold';
                    amount = 0;
                    reason = `无成牌无听牌，弃牌`;
                }
            }
        }
        
        // ===== 松紧度核心决策调整 =====
        // 在胜率约40%、底池赔率10%的场景下，根据松紧度调整决策
        if (handStrength.rank <= 2 && equity > 0.25 && equity < 0.55) {
            // 中等胜率场景（如顶对、两对），根据松紧度决定是raise还是call
            if (this.betToCall === 0) {
                // 没有下注需要跟注时
                if (equity >= raiseThreshold) {
                    // 胜率超过raise阈值，执行raise
                    const multiplier = config.raiseMultiplier;
                    action = 'raise';
                    amount = this.calculateRaise(multiplier);
                    reason = `[${config.name}风格] 胜率${(equity*100).toFixed(0)}%达到raise阈值${(raiseThreshold*100).toFixed(0)}%，${multiplier}bet加注`;
                } else if (equity >= callThreshold) {
                    action = 'call';
                    amount = 0;
                    reason = `[${config.name}风格] 胜率${(equity*100).toFixed(0)}%，过牌控制`;
                }
            } else {
                // 面对下注
                if (equity >= raiseThreshold) {
                    const multiplier = config.raiseMultiplier;
                    action = 'raise';
                    amount = this.calculateRaise(multiplier);
                    reason = `[${config.name}风格] 胜率${(equity*100).toFixed(0)}%，激进${multiplier}bet`;
                } else if (equity >= callThreshold || (equity >= potOdds && config.level >= 3)) {
                    action = 'call';
                    amount = this.betToCall;
                    reason = `[${config.name}风格] 胜率${(equity*100).toFixed(0)}%，跟注`;
                } else if (config.level <= 2) {
                    // 紧的玩家在胜率不够时弃牌
                    action = 'fold';
                    amount = 0;
                    reason = `[${config.name}风格] 胜率${(equity*100).toFixed(0)}%未达到跟注阈值${(callThreshold*100).toFixed(0)}%，弃牌`;
                }
            }
        }

        // 防止过度下注并考虑全押
        if (amount > this.stack) {
            amount = this.stack;
            if (action !== 'allin' && handStrength.rank >= 3) {
                action = 'allin';
                reason = `牌力足够强且筹码深度适合，全押获取最大价值`;
            }
        }

        return {
            action,
            amount,
            equity,
            potOdds,
            handStrength: handStrength.rank,
            handName: handStrength.name,
            reason,
            evCall,
            tightness: this.tightness,
            tightnessName: config.name,
            tightnessDesc: config.description,
            isRandomMode: this.isRandomMode,
            drawStrength: this.evaluateDraws()
        };
    }

    // 河牌决策
    riverDecision() {
        const handStrength = this.evaluateHandStrength();
        const potOdds = this.betToCall > 0 ? this.betToCall / (this.pot + this.betToCall) : 0;
        
        let action, amount, reason;
        
        if (handStrength.rank >= 8) { // 同花顺或皇家同花顺
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(1.3);  // 皇家同花顺下注1.3倍底池
                reason = `坚果牌 ${handStrength.name}，最大化价值下注`;
            } else {
                action = 'raise';
                amount = this.calculateRaise(3.0);  // 面对加注直接3-bet
                reason = `坚果牌 ${handStrength.name}，直接3-bet`;
            }
        }
        else if (handStrength.rank >= 7) { // 四条
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(1.1);  // 四条下注1.1倍底池
                reason = `四条 ${handStrength.name}，大额价值下注`;
            } else {
                action = 'raise';
                amount = this.calculateRaise(2.5);
                reason = `四条 ${handStrength.name}，加注`;
            }
        }
        else if (handStrength.rank >= 6) { // 葫芦
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(0.9);  // 葫芦0.9倍底池
                reason = `葫芦 ${handStrength.name}，大额价值下注`;
            } else if (this.betToCall <= this.pot * 0.7) {
                action = 'raise';
                amount = this.calculateRaise(2.2);
                reason = `葫芦 ${handStrength.name}，河牌加注`;
            } else {
                action = 'call';
                amount = this.betToCall;
                reason = `葫芦 ${handStrength.name}，跟注`;
            }
        }
        else if (handStrength.rank >= 5) { // 同花
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(0.75);  // 同花0.75倍底池
                reason = `同花 ${handStrength.name}，价值下注`;
            } else if (this.betToCall <= this.pot * 0.6) {
                action = 'raise';
                amount = this.calculateRaise(2.0);
                reason = `${handStrength.name}，河牌加注`;
            } else if (this.betToCall <= this.pot * 0.8) {
                action = 'call';
                amount = this.betToCall;
                reason = `${handStrength.name}，河牌跟注`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `${handStrength.name}，但下注过大可能被beat，弃牌`;
            }
        }
        else if (handStrength.rank >= 4) { // 顺子
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(0.7);  // 顺子0.7倍底池
                reason = `顺子 ${handStrength.name}，价值下注`;
            } else if (this.betToCall <= this.pot * 0.5) {
                action = 'call';
                amount = this.betToCall;
                reason = `${handStrength.name}，河牌跟注`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `顺子但面对大下注，可能有更强牌，弃牌`;
            }
        }
        else if (handStrength.rank >= 2) { // 两对或三条
            if (this.betToCall === 0) {
                action = 'raise';
                amount = this.calculateValueBet(0.5);  // 中等牌0.5倍底池
                reason = `${handStrength.name}，薄价值下注`;
            } else if (this.betToCall <= this.pot * 0.3) {
                action = 'call';
                amount = this.betToCall;
                reason = `${handStrength.name}，河牌跟注小下注`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `${handStrength.name}，但下注过大，弃牌`;
            }
        }
        else if (handStrength.rank === 1) { // 一对
            if (this.betToCall === 0) {
                // 是否薄价值下注或诈唬
                const positionWeight = POSITION_WEIGHTS[this.position] || 0.8;
                if (positionWeight >= 1.0 && handStrength.topPair) {
                    action = 'raise';
                    amount = this.calculateValueBet(0.33);  // 顶对薄价值下注0.33倍底池
                    reason = `顶对，薄价值下注`;
                } else {
                    action = 'call';
                    amount = 0;
                    reason = `一对，过牌`;
                }
            } else if (this.betToCall <= this.pot * 0.2 && handStrength.topPair) {
                action = 'call';
                amount = this.betToCall;
                reason = `顶对，跟注微小下注`;
            } else {
                action = 'fold';
                amount = 0;
                reason = `一对不足以跟注`;
            }
        }
        else {
            if (this.betToCall === 0) {
                // 是否诈唬
                if (this.position === 'btn' && Math.random() < 0.2) {
                    action = 'raise';
                    amount = this.calculateValueBet(0.8);  // 诈唬时大额下注
                    reason = `河牌诈唬`;
                } else {
                    action = 'call';
                    amount = 0;
                    reason = `无成牌，过牌`;
                }
            } else {
                action = 'fold';
                amount = 0;
                reason = `无成牌，弃牌`;
            }
        }

        // 河牌阶段如果加注金额接近或超过筹码，考虑全押
        if (amount > this.stack * 0.8 && handStrength.rank >= 5) {
            amount = this.stack;
            action = 'allin';
            reason = `河牌强牌，直接全押获取最大价值`;
        }

        return {
            action,
            amount,
            handStrength: handStrength.rank,
            handName: handStrength.name,
            potOdds,
            reason
        };
    }

    // 评估手牌强度
    evaluateHandStrength() {
        if (this.holeCards.length === 0) {
            return { rank: 0, name: '未知', topPair: false };
        }

        const allCards = [...this.holeCards, ...this.communityCards];
        const hand = new PokerHand(allCards);
        
        if (this.communityCards.length >= 3) {
            const eval_ = hand.evaluate();
            
            // 检查是否是顶对
            let topPair = false;
            if (eval_.rank === 1 && this.communityCards.length > 0) {
                const boardValues = this.communityCards.map(c => c.value);
                const maxBoard = Math.max(...boardValues);
                topPair = eval_.kickers[0] >= maxBoard;
            }
            
            return {
                rank: eval_.rank,
                name: HAND_NAMES[eval_.rank],
                kickers: eval_.kickers,
                topPair
            };
        } else {
            const eval_ = hand.evaluatePartial();
            return {
                rank: eval_.rank,
                name: eval_.name || HAND_NAMES[eval_.rank],
                topPair: false,
                flushDraw: eval_.flushDraw,
                straightDraw: eval_.straightDraw
            };
        }
    }

    // 评估听牌
    evaluateDraws() {
        if (this.communityCards.length < 3) {
            return { hasFlushDraw: false, hasOESD: false, equity: 0 };
        }

        const allCards = [...this.holeCards, ...this.communityCards];
        const suits = allCards.map(c => c.suit);
        const values = [...new Set(allCards.map(c => c.value))].sort((a, b) => b - a);
        
        // 同花听牌
        const suitCounts = {};
        suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
        const flushDrawSuit = Object.entries(suitCounts).find(([s, c]) => c === 4);
        const hasFlushDraw = !!flushDrawSuit;
        
        // 顺子听牌(两头顺)
        let hasOESD = false;
        let oesdType = '';
        
        for (let i = 0; i <= values.length - 3; i++) {
            if (values[i] - values[i + 2] === 2) {
                hasOESD = true;
                oesdType = '两头顺';
                break;
            }
        }
        
        // 卡顺(单张顺子)
        let gutShot = false;
        for (let i = 0; i <= values.length - 3; i++) {
            if (values[i] - values[i + 2] === 3) {
                gutShot = true;
            }
        }

        // 计算听牌权益
        let equity = 0;
        if (hasFlushDraw && hasOESD) {
            equity = 0.54; // 组合听牌
        } else if (hasFlushDraw) {
            equity = 0.35; // 同花听牌
        } else if (hasOESD) {
            equity = 0.32; // 两头顺
        } else if (gutShot) {
            equity = 0.17; // 卡顺
        }

        let type = [];
        if (hasFlushDraw) type.push('同花听牌');
        if (hasOESD) type.push('两头顺');
        else if (gutShot) type.push('卡顺');

        return {
            hasFlushDraw,
            hasOESD: hasOESD || gutShot,
            equity,
            type: type.join('+') || '无'
        };
    }

    // 计算下注量
    calculateBet(potPercent) {
        return Math.round(this.pot * potPercent);
    }

    calculateValueBet(potPercent) {
        return Math.round(this.pot * potPercent);
    }

    calculateRaise(multiplier) {
        const base = this.betToCall > 0 ? this.betToCall * multiplier : this.pot * 0.66;
        return Math.round(base);
    }

    // 获取手牌键值
    getHandKey() {
        if (this.holeCards.length < 2) return '';
        
        const isPair = this.holeCards[0].rank === this.holeCards[1].rank;
        const isSuited = this.holeCards[0].suit === this.holeCards[1].suit;
        
        const sorted = [...this.holeCards].sort((a, b) => b.value - a.value);
        
        if (isPair) {
            return sorted[0].rank + sorted[1].rank;
        }
        
        return sorted[0].rank + sorted[1].rank + (isSuited ? 's' : 'o');
    }

    // 获取位置名称
    getPositionName() {
        const names = {
            'utg': '枪口位',
            'utg1': '枪口+1',
            'mp': '中间位',
            'hj': '劫持位',
            'co': '关煞位',
            'btn': '庄家位',
            'sb': '小盲位',
            'bb': '大盲位'
        };
        return names[this.position] || this.position;
    }
}

// 导出
window.GTODecision = GTODecision;
window.calculateEquity = calculateEquity;
window.STARTING_HAND_RANKS = STARTING_HAND_RANKS;
