// Load saved transactions
const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Setup currency handling
let currentCurrency = "INR";
let conversionRates = {};

// Get DOM elements
const list = document.getElementById("transactionList");
const form = document.getElementById("transactionForm");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const dateInput = document.getElementById("date");
const currencySelector = document.getElementById("currencySelector");
const typeButtons = document.querySelectorAll('.type-btn');
const typeInput = document.getElementById('type');

dateInput.defaultValue = new Date().toISOString().split("T")[0];

fetchCurrencyRates();
currencySelector.addEventListener("change", (e) => {
    currentCurrency = e.target.value;
    fetchCurrencyRates();
});

// Format currency values
function formatCurrency(valueInINR) {
    let value = valueInINR;
    if (currentCurrency !== "INR" && conversionRates[currentCurrency]) {
        value = valueInINR * conversionRates[currentCurrency];
    }
    const fmt = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currentCurrency,
        signDisplay: "always",
    });
    if (value === 0) {
        return fmt.format(0).replace(/^[+-]/, "");
    }
    return fmt.format(value);
}

// Get latest currency rates
function fetchCurrencyRates() {
    fetch("https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_WB1jzQwe92Y5qeJu6ns3ahc6M0Hy4UiPHBEyp4vA&base_currency=INR")
        .then((resp) => resp.json())
        .then((data) => {
            conversionRates = data.data || {};
            updateUI();
        })
        .catch((err) => console.error("Failed to fetch rates", err));
}

function updateUI() {
    updateTotal();
    renderList();
    updateChart();
}

// Create transaction list item
function createItem({ id, name, amount, date, type, category }) {
    const sign = type === "income" ? 1 : -1;
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="name">
        <h4>${name}</h4>
        <p>${new Date(date).toLocaleDateString()} - ${category}</p>
      </div>
      <div class="amount ${type}">
        <span>${formatCurrency(amount * sign)}</span>
      </div>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTransaction(id);
    });
    li.appendChild(deleteBtn);

    li.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const newName = prompt("Edit name:", name);
        if (newName) {
            const trx = transactions.find(tx => tx.id === id);
            trx.name = newName;
            saveTransactions();
            updateUI();
        }
    });
    return li;
}

// Calculate and display totals
function updateTotal() {
    const incomeTotal = transactions
        .filter((trx) => trx.type === "income")
        .reduce((total, trx) => total + trx.amount, 0);
    const expenseTotal = transactions
        .filter((trx) => trx.type === "expense")
        .reduce((total, trx) => total + trx.amount, 0);
    const balanceTotal = incomeTotal - expenseTotal;

    balance.textContent = formatCurrency(balanceTotal).replace(/^\+/, "");
    income.textContent = formatCurrency(incomeTotal);
    expense.textContent = formatCurrency(expenseTotal * -1);
}

function renderList() {
    list.innerHTML = "";
    transactions.forEach((transaction) => {
        const li = createItem(transaction);
        list.appendChild(li);
    });
}

renderList();
updateTotal();

// Handle transaction deletion
function deleteTransaction(id) {
    const index = transactions.findIndex((trx) => trx.id === id);
    if (index > -1) {
        transactions.splice(index, 1);
        saveTransactions();
        updateUI();
    }
}

function handleTypeSelection() {
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            typeInput.value = btn.dataset.type;
        });
    });
}

// Handle transaction submit
function addTransaction(e) {
    e.preventDefault();
    const currentType = typeInput.value;
    const formData = new FormData(form);
    const uniqueId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newTransaction = {
        id: uniqueId,
        name: formData.get("name"),
        amount: parseFloat(formData.get("amount")),
        date: new Date(formData.get("date")),
        type: formData.get("type"),
        category: formData.get("category")
    };
    if (
        !newTransaction.name ||
        isNaN(newTransaction.amount) ||
        !newTransaction.date ||
        !newTransaction.category
    ) {
        alert("Please fill in all fields correctly.");
        return;
    }
    transactions.push(newTransaction);
    saveTransactions();

    updateUI();

    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];
    typeInput.value = currentType;
    typeButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.type === currentType);
    });
}

form.addEventListener("submit", addTransaction);
handleTypeSelection();

// Save to local storage
function saveTransactions() {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Update expense chart
function updateChart() {
    const categoryTotals = {};

    transactions
        .filter(trx => trx.type === 'expense')
        .forEach(trx => {
            if (!categoryTotals[trx.category]) {
                categoryTotals[trx.category] = 0;
            }
            categoryTotals[trx.category] += trx.amount;
        });

    const filteredCategories = Object.entries(categoryTotals)
        .filter(([_, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1]);

    const labels = filteredCategories.map(([category]) => category);
    const data = filteredCategories.map(([_, amount]) => amount);

    if (labels.length === 0) {
        updateChartData(['No Expenses'], [1]);
    } else {
        updateChartData(labels, data);
    }
}