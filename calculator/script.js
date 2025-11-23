// Calculator logic
const display = document.getElementById('display');
let currentExpression = ''; // expression string shown/edited
let lastResult = null;

// Helper: update visible display (shorten long text)
function updateDisplay(value) {
  const maxChars = 20;
  const str = String(value);
  if (str.length > maxChars) {
    // show trimmed with ellipsis on the left
    display.textContent = '…' + str.slice(-maxChars);
    display.title = str;
  } else {
    display.textContent = str;
    display.title = '';
  }
}

// Basic validation before evaluating: allow only digits, operators, parentheses, dot, spaces
function isValidExpression(expr) {
  // empty should be invalid for calc but valid for editing
  if (!expr || expr.trim() === '') return false;
  // allowed characters: digits, + - * / . % ( ) spaces
  if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return false;
  // not allow two operators in a row except minus (e.g. 5 * -2 is allowed but not 5 ** 2)
  if (/[\+\*\/%]{2,}/.test(expr)) return false;
  return true;
}

// Convert percent: change occurrences of number% to (number/100)
function replacePercent(expr) {
  // simple approach: replace "number%" with "(number/100)"
  return expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
}

// compute expression
function calculateExpression(expr) {
  try {
    if (!isValidExpression(expr)) throw new Error('Invalid expression');
    const safeExpr = replacePercent(expr);
    // further safety: disallow sequences like ")(" without operator => optional
    // Use Function instead of eval for slight sandboxing
    // Note: This code runs locally in the browser and is intended for learning.
    const result = Function('"use strict"; return (' + safeExpr + ')')();
    if (typeof result === 'number' && !Number.isFinite(result)) {
      throw new Error('Math error');
    }
    return result;
  } catch (err) {
    throw err;
  }
}

// Button handling
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');

    if (action === 'clear') {
      currentExpression = '';
      lastResult = null;
      updateDisplay('0');
      return;
    }

    if (action === 'back') {
      currentExpression = currentExpression.slice(0, -1);
      updateDisplay(currentExpression || '0');
      return;
    }

    if (action === 'calculate') {
      // evaluate
      try {
        const result = calculateExpression(currentExpression);
        lastResult = result;
        currentExpression = String(result);
        updateDisplay(currentExpression);
      } catch (e) {
        updateDisplay('Error');
        setTimeout(() => {
          // revert to previous expression or clear
          currentExpression = '';
          updateDisplay('0');
        }, 1200);
      }
      return;
    }

    if (action === 'percent') {
      // treat currentExpression as number and append %
      currentExpression += '%';
      updateDisplay(currentExpression);
      return;
    }

    // regular button with value (numbers/operators)
    if (val) {
      // prevent multiple dots in the same number segment
      if (val === '.') {
        // split on operators to get last number token
        const tokens = currentExpression.split(/[\+\-\*\/\(\)%\s]+/);
        const last = tokens[tokens.length - 1];
        if (last && last.includes('.')) {
          return; // ignore second dot
        }
        if (!last) {
          // if starting with . convert to 0.
          currentExpression += '0';
        }
      }

      // Avoid operator at start except minus
      if (/^[+\*\/%]$/.test(val) && currentExpression === '') return;

      currentExpression += val;
      updateDisplay(currentExpression);
    }
  });
});

// Keyboard support
window.addEventListener('keydown', (e) => {
  const key = e.key;

  // Allow numbers, operators, parentheses, dot, percent
  if (/^[0-9+\-*/().%]$/.test(key)) {
    // map 'x' or 'X' to '*'
    if (key === 'x' || key === 'X') {
      currentExpression += '*';
    } else {
      currentExpression += key;
    }
    updateDisplay(currentExpression);
    e.preventDefault();
    return;
  }

  if (key === 'Enter' || key === '=') {
    // calculate
    try {
      const result = calculateExpression(currentExpression);
      lastResult = result;
      currentExpression = String(result);
      updateDisplay(currentExpression);
    } catch (e) {
      updateDisplay('Error');
      setTimeout(() => { currentExpression = ''; updateDisplay('0'); }, 1200);
    }
    e.preventDefault();
    return;
  }

  if (key === 'Backspace') {
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay(currentExpression || '0');
    e.preventDefault();
    return;
  }

  if (key === 'Escape' || key === 'c' || key === 'C') {
    currentExpression = '';
    updateDisplay('0');
    e.preventDefault();
    return;
  }
});