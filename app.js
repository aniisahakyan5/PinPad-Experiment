/* =============================================
   PIN Pad Experiment — Refined Logic
   ============================================= */

(function () {
    'use strict';

    // ---- Phone layout mapping: grid position → digit ----
    const PHONE_LAYOUT = {
        0: '1', 1: '2', 2: '3',
        3: '4', 4: '5', 5: '6',
        6: '7', 7: '8', 8: '9',
        9: '0'
    };

    const ALLOWED_DIGITS = ['1', '2', '3', '7', '8', '9'];
    const PIN_LENGTH = 4;
    const STORAGE_KEY = 'pinPadResults';

    // ---- State ----
    let currentName = '';
    let generatedNumber = '';
    let enteredPositions = [];
    let enteredDigits = [];

    // ---- DOM References ----
    const screens = {
        name: document.getElementById('screen-name'),
        pinpad: document.getElementById('screen-pinpad'),
        results: document.getElementById('screen-results')
    };

    const nameInput = document.getElementById('name-input');
    const btnStart = document.getElementById('btn-start');
    const btnViewResults = document.getElementById('btn-view-results');
    const pinpadReminder = document.getElementById('pinpad-reminder');
    const pinDots = document.querySelectorAll('.pin-dot');
    const pinDisplay = document.getElementById('pin-display');
    const resultsContainer = document.getElementById('results-container');
    const btnBack = document.getElementById('btn-back');

    // ---- Screen Navigation ----
    function showScreen(screenId) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[screenId].classList.add('active');
    }

    // ---- Random Number Generation ----
    function generateRandomNumber() {
        let num = '';
        for (let i = 0; i < PIN_LENGTH; i++) {
            const idx = Math.floor(Math.random() * ALLOWED_DIGITS.length);
            num += ALLOWED_DIGITS[idx];
        }
        return num;
    }

    // ---- PIN Pad Logic ----
    function resetPinInput() {
        enteredPositions = [];
        enteredDigits = [];
        pinDots.forEach(dot => dot.classList.remove('filled'));
    }

    function updatePinDisplay() {
        pinDots.forEach((dot, i) => {
            if (i < enteredDigits.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    function handlePinButton(pos) {
        if (enteredDigits.length >= PIN_LENGTH) return;
        const digit = PHONE_LAYOUT[pos];
        if (digit === undefined) return;
        enteredPositions.push(pos);
        enteredDigits.push(digit);
        updatePinDisplay();
    }

    function handleBackspace() {
        if (enteredDigits.length === 0) return;
        enteredPositions.pop();
        enteredDigits.pop();
        updatePinDisplay();
    }

    function handleEnter() {
        if (enteredDigits.length !== PIN_LENGTH) {
            pinDisplay.classList.add('shake');
            setTimeout(() => pinDisplay.classList.remove('shake'), 400);
            return;
        }
        saveResult();
        resetToNextUser();
    }

    // ---- Local Storage ----
    function getResults() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveResult() {
        const results = getResults();
        results.push({
            name: currentName,
            generatedNumber: generatedNumber,
            enteredNumber: enteredDigits.join(''),
            buttonPositions: [...enteredPositions],
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    }

    // ---- App Loop Logic ----
    function resetToNextUser() {
        // Reset state for next participant
        currentName = '';
        nameInput.value = '';
        btnStart.disabled = true;
        resetPinInput();

        // Jump back to name screen
        showScreen('name');
    }

    // ---- Admin Results View ----
    // Call this in console to see results: showAdminResults()
    window.showAdminResults = function () {
        renderResults();
        showScreen('results');
    };

    function renderResults() {
        const results = getResults();
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">No results yet.</p>';
            return;
        }

        let html = `
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-top:20px;">
        <thead style="color:var(--accent); text-align:left; border-bottom:1px solid rgba(0,190,213,0.3);">
          <tr>
            <th style="padding:10px 5px;">Participant</th>
            <th style="padding:10px 5px;">Expected</th>
            <th style="padding:10px 5px;">Entered</th>
          </tr>
        </thead>
        <tbody>
    `;

        results.forEach(r => {
            const isMatch = r.generatedNumber === r.enteredNumber;
            html += `
        <tr style="border-bottom:1px solid rgba(0,190,213,0.1);">
          <td style="padding:10px 5px;">${escapeHtml(r.name)}</td>
          <td style="padding:10px 5px; font-weight:800; color:var(--accent);">${r.generatedNumber}</td>
          <td style="padding:10px 5px; color:${isMatch ? 'var(--success)' : 'var(--danger)'}">${r.enteredNumber}</td>
        </tr>
      `;
        });

        html += '</tbody></table>';
        resultsContainer.innerHTML = html;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Event Listeners ----

    nameInput.addEventListener('input', () => {
        btnStart.disabled = nameInput.value.trim().length === 0;
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btnStart.disabled) btnStart.click();
    });

    btnStart.addEventListener('click', () => {
        currentName = nameInput.value.trim();
        generatedNumber = generateRandomNumber();
        pinpadReminder.textContent = generatedNumber;
        resetPinInput();
        showScreen('pinpad');
    });

    btnViewResults.addEventListener('click', () => {
        window.location.hash = '#/results';
    });

    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'backspace') handleBackspace();
            else if (action === 'enter') handleEnter();
            else if (btn.dataset.pos !== undefined) handlePinButton(parseInt(btn.dataset.pos, 10));
        });
    });

    btnBack.addEventListener('click', () => {
        window.location.hash = '';
        showScreen('name');
    });

    // ---- Hash Routing for Results ----
    function handleHashChange() {
        if (window.location.hash === '#/results') {
            renderResults();
            showScreen('results');
        } else if (screens.results.classList.contains('active')) {
            showScreen('name');
        }
    }

    window.addEventListener('hashchange', handleHashChange);

    // Check initial hash on load
    handleHashChange();

})();
