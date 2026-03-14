const session = attachCommonUi();
if (session) {
  const name = document.getElementById('currentUserName');
  if (name) name.textContent = `${session.fullName} (${session.role})`;

  const users = getUsers();
  const model = getModel();
  const predictions = getPredictions();

  const totalUsers = document.getElementById('totalUsers');
  const totalClasses = document.getElementById('totalClasses');
  const totalImages = document.getElementById('totalImages');
  const totalPredictions = document.getElementById('totalPredictions');
  if (totalUsers) totalUsers.textContent = users.length;
  if (totalClasses) totalClasses.textContent = model?.classes?.length || 0;
  if (totalImages) totalImages.textContent = model?.trainingImageCount || 0;
  if (totalPredictions) totalPredictions.textContent = predictions.length;

  const modelSummary = document.getElementById('modelSummary');
  if (modelSummary) {
    if (!model) {
      modelSummary.innerHTML = '<div class="alert alert-warning mb-0">No model trained yet. Go to <strong>Train Model</strong> and upload images to create one.</div>';
    } else {
      modelSummary.innerHTML = `
        <div class="row g-3">
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Model Type</div><div class="fw-bold">Lightweight centroid classifier</div></div></div>
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Feature Size</div><div class="fw-bold">${model.featureLength}</div></div></div>
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Trained Classes</div><div class="fw-bold">${model.classes.join(', ')}</div></div></div>
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Training Images</div><div class="fw-bold">${model.trainingImageCount}</div></div></div>
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Trained By</div><div class="fw-bold">${model.trainedBy || '-'}</div></div></div>
          <div class="col-sm-6"><div class="p-3 rounded-4 bg-light"><div class="text-muted small">Trained At</div><div class="fw-bold">${new Date(model.trainedAt).toLocaleString()}</div></div></div>
        </div>`;
    }
  }

  const list = document.getElementById('recentPredictions');
  if (list) {
    list.innerHTML = predictions.slice(-5).reverse().map(p => `
      <div class="item">
        <div class="fw-semibold">${p.predictedClass}</div>
        <div class="text-muted small">Confidence: ${p.confidence}%</div>
        <div class="text-muted small">${new Date(p.time).toLocaleString()}</div>
      </div>`).join('') || '<div class="text-muted">No predictions yet.</div>';
  }

  const classChartCanvas = document.getElementById('classDistributionChart');
  if (classChartCanvas && typeof Chart !== 'undefined') {
    const counts = model?.classImageCounts || {};
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    new Chart(classChartCanvas, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [{
          label: 'Images',
          data: values.length ? values : [0],
          borderWidth: 1,
          borderRadius: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  const predictionChartCanvas = document.getElementById('predictionHistoryChart');
  if (predictionChartCanvas && typeof Chart !== 'undefined') {
    const recent = predictions.slice(-10);
    const labels = recent.map((row, idx) => `#${idx + 1}`);
    const values = recent.map(row => Number(row.confidence || 0));
    new Chart(predictionChartCanvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [{
          label: 'Confidence %',
          data: values.length ? values : [0],
          tension: 0.35,
          fill: false,
          borderWidth: 3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  }
}
