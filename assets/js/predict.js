attachCommonUi();
const predictFile = document.getElementById('predictFile');
const predictPreview = document.getElementById('predictPreview');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const predictBtn = document.getElementById('predictBtn');
const predictionResult = document.getElementById('predictionResult');
const scoreBars = document.getElementById('scoreBars');

function imageToFeatureVector(imageSource, size = 24) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageSource, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const out = [];
  for (let i = 0; i < data.length; i += 4) {
    out.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
  }
  return out;
}
function distance(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    total += diff * diff;
  }
  return Math.sqrt(total);
}
async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

predictFile?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  predictPreview.src = url;
  predictPreview.classList.remove('d-none');
  previewPlaceholder.classList.add('d-none');
});

predictBtn?.addEventListener('click', async () => {
  const model = getModel();
  const file = predictFile.files?.[0];
  if (!model) {
    Swal.fire({ icon: 'warning', title: 'No trained model', text: 'Please train the model first.' });
    return;
  }
  if (!file) {
    Swal.fire({ icon: 'warning', title: 'No image selected' });
    return;
  }
  try {
    const img = await fileToImage(file);
    const vector = imageToFeatureVector(img, model.size || 24);
    const scored = model.centroids.map(row => ({
      className: row.className,
      distance: distance(vector, row.centroid)
    })).sort((a,b) => a.distance - b.distance);

    const rawScores = scored.map(s => 1 / (s.distance + 1e-6));
    const scoreSum = rawScores.reduce((a,b) => a + b, 0);
    const normalized = scored.map((s, idx) => ({
      className: s.className,
      confidence: (rawScores[idx] / scoreSum) * 100,
      distance: s.distance
    })).sort((a,b)=>b.confidence-a.confidence);

    const best = normalized[0];
    predictionResult.innerHTML = `
      <div class="alert alert-success rounded-4">
        <div class="fw-bold fs-5">Predicted Class: ${best.className}</div>
        <div>Confidence: ${best.confidence.toFixed(2)}%</div>
      </div>`;

    scoreBars.innerHTML = normalized.map(item => `
      <div class="score-item">
        <div class="d-flex justify-content-between small mb-1"><span>${item.className}</span><span>${item.confidence.toFixed(2)}%</span></div>
        <div class="progress"><div class="bar" style="width:${item.confidence}%"></div></div>
      </div>`).join('');

    const rows = getPredictions();
    rows.push({ predictedClass: best.className, confidence: best.confidence.toFixed(2), time: new Date().toISOString() });
    savePredictions(rows);
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Prediction failed', text: error.message || String(error) });
  }
});
