const sessionTrain = attachCommonUi();
let classCounter = 0;
const classContainer = document.getElementById('classContainer');
const addClassBtn = document.getElementById('addClassBtn');
const trainBtn = document.getElementById('trainBtn');
const resetDatasetBtn = document.getElementById('resetDatasetBtn');
const trainingLog = document.getElementById('trainingLog');
const datasetBadge = document.getElementById('datasetBadge');
const trainingProgress = document.getElementById('trainingProgress');
const classFileStore = {};

function addClassCard(name = '') {
  classCounter += 1;
  const classId = `class-${classCounter}`;
  const html = `
    <div class="col-lg-6">
      <div class="class-box" data-class-id="${classId}">
        <div class="d-flex justify-content-between align-items-center mb-3 gap-2">
          <input class="form-control form-control-lg class-name" placeholder="Class name e.g. Healthy" value="${name}">
          <button type="button" class="btn btn-outline-danger remove-class"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
          <label class="btn btn-primary mb-0">
            <i class="bi bi-images me-2"></i>Select images
            <input type="file" class="d-none class-file-input" accept="image/*" multiple>
          </label>
          <button type="button" class="btn btn-outline-secondary clear-images">Clear images</button>
          <span class="badge text-bg-light image-count">0 images</span>
        </div>
        <div class="small text-muted mb-2">You can select many pictures at once, and add more again without losing the ones already selected.</div>
        <div class="preview-grid"></div>
      </div>
    </div>`;
  classContainer.insertAdjacentHTML('beforeend', html);
  classFileStore[classId] = [];
  bindClassEvents();
  updateBadge();
}

function bytesToReadable(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileFingerprint(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

function renderClassPreview(classId) {
  const box = classContainer.querySelector(`.class-box[data-class-id="${classId}"]`);
  if (!box) return;
  const previewGrid = box.querySelector('.preview-grid');
  const imageCount = box.querySelector('.image-count');
  const files = classFileStore[classId] || [];
  imageCount.textContent = `${files.length} image${files.length === 1 ? '' : 's'}`;
  previewGrid.innerHTML = '';

  files.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'preview-thumb';
    div.innerHTML = `
      <img src="${entry.dataUrl}" alt="preview">
      <small class="d-block text-truncate" title="${entry.file.name}">${entry.file.name}</small>
      <small class="text-muted d-block">${bytesToReadable(entry.file.size)}</small>
      <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-image" data-index="${index}">
        <i class="bi bi-trash"></i>
      </button>`;
    previewGrid.appendChild(div);
  });

  previewGrid.querySelectorAll('.remove-image').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      classFileStore[classId].splice(idx, 1);
      renderClassPreview(classId);
      updateBadge();
    });
  });
}

function bindClassEvents() {
  classContainer.querySelectorAll('.class-box').forEach(box => {
    const classId = box.dataset.classId;
    const removeBtn = box.querySelector('.remove-class');
    const fileInput = box.querySelector('.class-file-input');
    const clearBtn = box.querySelector('.clear-images');

    if (!removeBtn.dataset.bound) {
      removeBtn.dataset.bound = '1';
      removeBtn.addEventListener('click', () => {
        delete classFileStore[classId];
        box.closest('.col-lg-6').remove();
        updateBadge();
      });
    }

    if (!clearBtn.dataset.bound) {
      clearBtn.dataset.bound = '1';
      clearBtn.addEventListener('click', () => {
        classFileStore[classId] = [];
        fileInput.value = '';
        renderClassPreview(classId);
        updateBadge();
      });
    }

    if (!fileInput.dataset.bound) {
      fileInput.dataset.bound = '1';
      fileInput.addEventListener('change', async () => {
        const incomingFiles = [...fileInput.files];
        if (!incomingFiles.length) return;

        const known = new Set((classFileStore[classId] || []).map(row => fileFingerprint(row.file)));
        const accepted = [];
        for (const file of incomingFiles) {
          if (!file.type.startsWith('image/')) continue;
          const fp = fileFingerprint(file);
          if (known.has(fp)) continue;
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          accepted.push({ file, dataUrl, fp });
          known.add(fp);
        }

        classFileStore[classId] = [...(classFileStore[classId] || []), ...accepted];
        renderClassPreview(classId);
        updateBadge();
        fileInput.value = '';
      });
    }
  });
}

function updateBadge() {
  const classCount = classContainer.querySelectorAll('.class-box').length;
  const totalImages = Object.values(classFileStore).reduce((sum, rows) => sum + rows.length, 0);
  datasetBadge.textContent = `${classCount} classes • ${totalImages} images`;
}

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

function meanVector(vectors) {
  const length = vectors[0].length;
  const sum = new Array(length).fill(0);
  vectors.forEach(vec => { for (let i = 0; i < length; i++) sum[i] += vec[i]; });
  return sum.map(v => v / vectors.length);
}

async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function buildModelFromDataset() {
  const classBoxes = [...document.querySelectorAll('.class-box')];
  const prepared = [];
  let totalImageCount = 0;

  for (const box of classBoxes) {
    const classId = box.dataset.classId;
    const className = box.querySelector('.class-name').value.trim();
    const files = (classFileStore[classId] || []).map(row => row.file);
    if (!className || files.length === 0) continue;

    const vectors = [];
    for (const file of files) {
      const img = await fileToImage(file);
      vectors.push(imageToFeatureVector(img, 24));
      totalImageCount += 1;
    }
    prepared.push({ className, vectors, imageCount: files.length });
  }

  if (prepared.length < 2) throw new Error('Please provide at least 2 classes with images.');
  const centroids = prepared.map(entry => ({
    className: entry.className,
    centroid: meanVector(entry.vectors),
    imageCount: entry.imageCount
  }));

  return {
    type: 'centroid-classifier',
    size: 24,
    featureLength: centroids[0].centroid.length,
    classes: centroids.map(c => c.className),
    centroids,
    classImageCounts: Object.fromEntries(centroids.map(c => [c.className, c.imageCount])),
    trainingImageCount: totalImageCount,
    trainedBy: sessionTrain?.fullName || 'Unknown',
    trainedAt: new Date().toISOString()
  };
}

function simulateProgress(percent, message) {
  trainingProgress.style.width = `${percent}%`;
  trainingProgress.textContent = `${percent}%`;
  trainingLog.textContent = message;
}

addClassBtn?.addEventListener('click', () => addClassCard());
resetDatasetBtn?.addEventListener('click', () => {
  Swal.fire({ icon: 'question', title: 'Reset dataset?', text: 'All selected images will be removed.', showCancelButton: true }).then(res => {
    if (!res.isConfirmed) return;
    classContainer.innerHTML = '';
    Object.keys(classFileStore).forEach(k => delete classFileStore[k]);
    addClassCard('Healthy');
    addClassCard('Sick');
    simulateProgress(0, 'Dataset reset. Add pictures again to train.');
    updateBadge();
  });
});

trainBtn?.addEventListener('click', async () => {
  try {
    simulateProgress(10, 'Checking classes and selected images...');
    const model = await buildModelFromDataset();
    simulateProgress(55, 'Extracting lightweight image features...');
    saveModel(model);
    simulateProgress(85, 'Saving model to browser storage...');
    setTimeout(() => simulateProgress(100, 'Training complete. Model saved in browser.'), 180);
    Swal.fire({
      icon: 'success',
      title: 'Training completed',
      html: `Model trained with <b>${model.trainingImageCount}</b> images across <b>${model.classes.length}</b> classes.`
    });
  } catch (error) {
    simulateProgress(0, 'Training failed.');
    Swal.fire({ icon: 'error', title: 'Training failed', text: error.message || String(error) });
  }
});

addClassCard('Healthy');
addClassCard('Sick');
