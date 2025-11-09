// ゲーム状態の管理
class HitAndBlowGame {
    constructor(settings = {}) {
        // デフォルト設定（重複なし）
        this.settings = {
            allowDuplicates: settings.allowDuplicates === true,
            digitCount: settings.digitCount || 10, // 使用する数字の種類数（6-16）
        };
        console.log('ゲーム設定:', this.settings);
        this.answer = this.generateAnswer();
        console.log('正解:', this.answer.join(''));
        this.attempts = 0;
        this.history = [];
        this.init();
        this.setInputsEnabled(true);
        this.hideNewGameButton();
        this.syncSettingsControls();
    }

    // 利用可能な数字/文字のリストを取得
    getAvailableDigits() {
        const digits = [];
        for (let i = 0; i < this.settings.digitCount; i++) {
            if (i < 10) {
                digits.push(i.toString());
            } else {
                // 10以降はA-F
                digits.push(String.fromCharCode(65 + (i - 10))); // 65 = 'A'
            }
        }
        return digits;
    }

    // 4桁のランダムな数字を生成
    generateAnswer() {
        const availableDigits = this.getAvailableDigits();
        const digits = [];

        if (this.settings.allowDuplicates) {
            // 重複を許可する場合
            for (let i = 0; i < 4; i++) {
                const randomIndex = Math.floor(Math.random() * availableDigits.length);
                digits.push(availableDigits[randomIndex]);
            }
        } else {
            // 重複を許可しない場合
            const shuffled = [...availableDigits];
            // Fisher-Yatesシャッフル
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            // 最初の4つを取得
            for (let i = 0; i < 4; i++) {
                digits.push(shuffled[i]);
            }
        }

        return digits;
    }

    // ゲームの初期化
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateRulesDisplay();
    }

    // ルール説明を更新
    updateRulesDisplay() {
        // 重複ルールの更新
        const duplicateRule = document.getElementById('duplicateRule');
        if (duplicateRule) {
            duplicateRule.textContent = this.settings.allowDuplicates
                ? '同じ数字が複数使われることもあります'
                : '同じ数字は使われません（重複なし）';
        }

        // 数字の範囲ルールの更新
        const digitRangeRule = document.getElementById('digitRangeRule');
        if (digitRangeRule) {
            const availableDigits = this.getAvailableDigits();
            const lastDigit = availableDigits[availableDigits.length - 1];
            digitRangeRule.textContent = `使用される数字: ${availableDigits[0]}-${lastDigit}`;
        }
    }

    // 入力欄と送信ボタンの有効/無効を切り替え
    setInputsEnabled(enabled) {
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = !enabled;
        }
    }

    // ヘッダーの「もう一度プレイ」ボタンを表示
    showNewGameButton() {
        const btn = document.getElementById('newGameBtn');
        if (btn) {
            btn.classList.add('active');
        }
    }

    // ヘッダーの「もう一度プレイ」ボタンを非表示
    hideNewGameButton() {
        const btn = document.getElementById('newGameBtn');
        if (btn) {
            btn.classList.remove('active');
        }
    }

    // 設定モーダルのコントロールをゲーム設定に同期
    syncSettingsControls() {
        const duplicatesRadio = document.querySelector(`input[name="duplicates"][value="${this.settings.allowDuplicates ? 'allow' : 'forbid'}"]`);
        if (duplicatesRadio) {
            duplicatesRadio.checked = true;
        }

        const digitCountSlider = document.getElementById('digitCount');
        if (digitCountSlider) {
            digitCountSlider.value = this.settings.digitCount;
            updateDigitCountDisplay(this.settings.digitCount);
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 数字入力の自動フォーカス移動
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase();
                e.target.value = value;

                // 1桁のみ許可
                if (value.length > 1) {
                    e.target.value = value.slice(0, 1);
                    value = e.target.value;
                }

                // 使用可能な数字/文字のみ許可
                const availableDigits = this.getAvailableDigits();
                if (value && !availableDigits.includes(value)) {
                    e.target.value = '';
                    return;
                }

                // 重複なしモードの場合、重複チェック
                if (!this.settings.allowDuplicates && value) {
                    const allInputs = Array.from(inputs);
                    const currentValues = allInputs.map(inp => inp.value.toUpperCase());
                    const duplicateCount = currentValues.filter(v => v === value).length;

                    if (duplicateCount > 1) {
                        // 重複があれば入力をクリア
                        e.target.value = '';
                        this.showDuplicateWarning(input);
                        return;
                    }
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

        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        const winModalCloseBtn = document.getElementById('winModalClose');
        if (winModalCloseBtn) {
            winModalCloseBtn.addEventListener('click', () => {
                this.hideWinModal();
            });
        }

        const winModal = document.getElementById('winModal');
        if (winModal) {
            winModal.addEventListener('click', (event) => {
                if (event.target === winModal) {
                    this.hideWinModal();
                }
            });
        }
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
            guess.push(input.value.toUpperCase());
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
    showError() {
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

    // 重複警告表示
    showDuplicateWarning(input) {
        input.style.borderColor = '#ff9800';
        input.style.backgroundColor = '#fff3e0';

        setTimeout(() => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        }, 500);
    }

    // 勝利モーダルを表示
    showWinModal() {
        const modal = document.getElementById('winModal');
        document.getElementById('answerDisplay').textContent = this.answer.join('');
        document.getElementById('finalAttempts').textContent = this.attempts;
        this.setInputsEnabled(false);
        this.showNewGameButton();
        modal.classList.add('active');
    }

    // 勝利モーダルを非表示にする
    hideWinModal() {
        const modal = document.getElementById('winModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // ゲームをリセット（設定を保持）
    resetGame() {
        this.answer = this.generateAnswer();
        console.log('新しいゲーム開始 - 正解:', this.answer.join(''));
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

        // ルール表示を更新
        this.updateRulesDisplay();

        // 入力を再度受け付けるようにし、新しいゲームボタンをしまう
        this.setInputsEnabled(true);
        this.hideNewGameButton();

        // モーダルを閉じる
        this.hideWinModal();
    }

    // 設定を更新してゲームを再起動
    updateSettings(newSettings) {
        const digitCount = Math.max(6, Math.min(16, newSettings.digitCount || 10));
        this.settings = {
            allowDuplicates: newSettings.allowDuplicates === true,
            digitCount: digitCount
        };
        console.log('設定更新:', this.settings);
        this.resetGame();
    }
}

// ゲームを開始
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new HitAndBlowGame();

    // 設定ボタンのイベントリスナー
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const modal = document.getElementById('settingsModal');

        game.syncSettingsControls();
        modal.classList.add('active');
    });

    // 設定モーダルのキャンセルボタン
    document.getElementById('settingsCancelBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });

    // 設定モーダルの保存ボタン
    document.getElementById('settingsSaveBtn').addEventListener('click', () => {
        const allowDuplicates = document.querySelector('input[name="duplicates"]:checked').value === 'allow';
        const digitCount = parseInt(document.getElementById('digitCount').value);

        game.updateSettings({
            allowDuplicates: allowDuplicates,
            digitCount: digitCount
        });

        document.getElementById('settingsModal').classList.remove('active');
    });

    // スライダーの値変更イベント
    const digitCountSlider = document.getElementById('digitCount');
    digitCountSlider.addEventListener('input', (e) => {
        updateDigitCountDisplay(parseInt(e.target.value));
    });
});

// 数字の種類数の表示を更新
function updateDigitCountDisplay(count) {
    document.getElementById('digitCountValue').textContent = count;

    let rangeText = '';
    if (count <= 10) {
        rangeText = `(0-${count - 1})`;
    } else {
        const lastChar = String.fromCharCode(65 + (count - 11)); // 65 = 'A'
        rangeText = `(0-9, A-${lastChar})`;
    }
    document.getElementById('digitRange').textContent = rangeText;
}
