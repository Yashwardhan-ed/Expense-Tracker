// Category color definitions
const categoryColors = {
    Food: '#FF6B6B',
    Travel: '#4ECDC4',
    Utilities: '#45B7D1',
    Entertainment: '#96CEB4',
    Others: '#FFEEAD'
};

// Chart instance reference
let expenseChart;

// Create new chart instance
function initChart() {
    const ctx = document.getElementById("expenseChart");
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 2,
                borderColor: '#242424'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#76ff03',
                        font: {
                            family: '"Press Start 2P", cursive',
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });
}

// Update chart with new data
function updateChartData(labels, data) {
    if (!expenseChart) {
        initChart();
    }

    if (!expenseChart) return;

    const colors = labels.map(label => categoryColors[label] || `hsl(${Math.random() * 360}, 70%, 60%)`);

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.data.datasets[0].backgroundColor = colors;

    expenseChart.update();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initChart);
