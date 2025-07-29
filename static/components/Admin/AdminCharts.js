export default {
  name: 'AdminCharts',
  template: `
  <div class="container mt-4">
    <h2 class="text-center mb-4">Admin Analytics</h2>

    <div class="admin-chart-grid">
      <div class="chart-box">
        <h5>Top Scores (%)</h5>
        <div class="chart-container">
          <canvas id="topScoresChart"></canvas>
        </div>
      </div>

      <div class="chart-box">
        <h5>Students by Level</h5>
        <div class="chart-container">
          <canvas id="byLevelChart"></canvas>
        </div>
      </div>

      <div class="chart-box">
        <h5>Attempts by Subject</h5>
        <div class="chart-container">
          <canvas id="bySubjectChart"></canvas>
        </div>
      </div>
    </div>
  </div>
`,





  mounted() {
    this.fetchChartData();
  },
  methods: {
    async fetchChartData() {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authentication-Token': localStorage.getItem('token') }
      });
      if (!res.ok) {
        console.error('Charts load failed');
        return;
      }
      const data = await res.json();
      this.renderTopScores(data.top_scores);
      this.renderByLevel(data.by_level);
      this.renderBySubject(data.by_subject);
    },

    renderTopScores(arr) {
      const ctx = document.getElementById('topScoresChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: arr.map(a => a.username),
          datasets: [{
            label: 'Percentage',
            data: arr.map(a => a.percentage),
            backgroundColor: '#4e73df'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: { beginAtZero: true, max: 100 }
            }]
          }
        }
      });
    },

    renderByLevel(arr) {
      const ctx = document.getElementById('byLevelChart').getContext('2d');
      const total = arr.reduce((sum, a) => sum + a.count, 0);
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: arr.map(a => a.level),
          datasets: [{
            data: arr.map(a => a.count),
            backgroundColor: ['#1cc88a','#36b9cc','#f6c23e','#e74a3b','#858796','#5a5c69']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.raw;
                  const percentage = ((value / total) * 100).toFixed(0); // integer
                  return `${label}: ${percentage}% (${value})`;
                }
              }
            },
            datalabels:{
              color: '#fff',
              font: {
                weight: 'bold'
              },
              formatter: (value, context) => {
                const percentage = ((value / total)*100).toFixed(0);
                return `${percentage}%`;
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    },

    renderBySubject(arr) {
      const ctx = document.getElementById('bySubjectChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: arr.map(a => a.subject),
          datasets: [{
            label: 'Quiz Attempts',
            data: arr.map(a => a.attempt_count),
            backgroundColor: '#1cc88a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: { beginAtZero: true }
            }]
          }
        }
      });
    }
  }
};
