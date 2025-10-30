// ゲーム状態の管理
class HitAndBlowGame {
    constructor() {
        this.answer = this.generateAnswer();
        this.attempts = 0;
        this.history = [];
        this.init();
    }

    // 4桁のランダムな数字を生成
    generateAnswer() {
        const digits = [];
        for (let i = 0; i < 4; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }
        return digits;
    }

    // ゲームの初期化
    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 数字入力の自動フォーカス移動
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // 1桁のみ許可
                if (value.length > 1) {
                    e.target.value = value.slice(0, 1);
                }

                // 数字のみ許可
                if (!/^\d*$/.test(e.target.value)) {
                    e.target.value = '';
                    return;
                }

                // 次の入力欄に自動移動
                if (value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            // Backspaceで前の入力欄に戻る
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    inputs[index - 1].focus();
                }

                // Enterで送信
                if (e.key === 'Enter') {
                    this.submitGuess();
                }
            });
        });

        // 送信ボタン
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitGuess();
        });

        // ルールトグル
        document.getElementById('rulesToggle').addEventListener('click', () => {
            const content = document.getElementById('rulesContent');
            content.classList.toggle('active');
        });

        // もう一度プレイボタン
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    // 予想を送信
    submitGuess() {
        const inputs = document.querySelectorAll('.digit-input');
        const guess = [];

        // 入力値の取得と検証
        for (let input of inputs) {
            if (input.value === '') {
                this.showError('4桁すべて入力してください');
                input.focus();
                return;
            }
            guess.push(parseInt(input.value));
        }

        // ヒットとブローの計算
        const result = this.calculateHitAndBlow(guess);

        // 試行回数を増やす
        this.attempts++;

        // 履歴に追加
        this.history.unshift({
            guess: guess.join(''),
            hit: result.hit,
            blow: result.blow
        });

        // 表示を更新
        this.updateDisplay();
        this.addHistoryItem(guess.join(''), result.hit, result.blow);

        // 入力欄をクリア
        inputs.forEach(input => input.value = '');
        inputs[0].focus();

        // 正解チェック
        if (result.hit === 4) {
            this.showWinModal();
        }
    }

    // ヒットとブローを計算
    calculateHitAndBlow(guess) {
        let hit = 0;
        let blow = 0;

        // ヒットのカウント用に使用済みフラグを作成
        const answerUsed = new Array(4).fill(false);
        const guessUsed = new Array(4).fill(false);

        // まずヒットをカウント
        for (let i = 0; i < 4; i++) {
            if (guess[i] === this.answer[i]) {
                hit++;
                answerUsed[i] = true;
                guessUsed[i] = true;
            }
        }

        // ブローをカウント
        for (let i = 0; i < 4; i++) {
            if (!guessUsed[i]) {
                for (let j = 0; j < 4; j++) {
                    if (!answerUsed[j] && guess[i] === this.answer[j]) {
                        blow++;
                        answerUsed[j] = true;
                        break;
                    }
                }
            }
        }

        return { hit, blow };
    }

    // 表示を更新
    updateDisplay() {
        document.getElementById('attempts').textContent = this.attempts;

        if (this.history.length > 0) {
            document.getElementById('lastHit').textContent = this.history[0].hit;
            document.getElementById('lastBlow').textContent = this.history[0].blow;
        }
    }

    // 履歴アイテムを追加
    addHistoryItem(guess, hit, blow) {
        const historyList = document.getElementById('historyList');

        // 空メッセージを削除
        const emptyMessage = historyList.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-guess">${guess}</div>
            <div class="history-result">
                <span class="result-badge hit-badge">Hit: ${hit}</span>
                <span class="result-badge blow-badge">Blow: ${blow}</span>
            </div>
        `;

        historyList.insertBefore(item, historyList.firstChild);
    }

    // エラー表示
    showError(message) {
        // 簡易的なエラー表示（アラート）
        // より洗練された実装も可能
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach(input => {
            input.style.borderColor = '#f5576c';
        });

        setTimeout(() => {
            inputs.forEach(input => {
                input.style.borderColor = '';
            });
        }, 1000);
    }

    // 勝利モーダルを表示
    showWinModal() {
        const modal = document.getElementById('winModal');
        document.getElementById('answerDisplay').textContent = this.answer.join('');
        document.getElementById('finalAttempts').textContent = this.attempts;
        modal.classList.add('active');
    }

    // ゲームをリセット
    resetGame() {
        this.answer = this.generateAnswer();
        this.attempts = 0;
        this.history = [];

        // 表示をリセット
        document.getElementById('attempts').textContent = '0';
        document.getElementById('lastHit').textContent = '-';
        document.getElementById('lastBlow').textContent = '-';

        // 履歴をクリア
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '<p class="empty-message">まだ予想がありません</p>';

        // 入力欄をクリア
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach(input => input.value = '');
        inputs[0].focus();

        // モーダルを閉じる
        document.getElementById('winModal').classList.remove('active');
    }
}

// ゲームを開始
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new HitAndBlowGame();
});
