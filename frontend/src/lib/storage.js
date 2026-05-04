export const samplePatient = {
  age: 55,
  sex: 1,
  dataset: "Cleveland",
  cp: 0,
  trestbps: 145,
  chol: 233,
  fbs: 1,
  restecg: 1,
  thalach: 150,
  exang: 0,
  oldpeak: 2.3,
  slope: 2,
  ca: 0,
  thal: 1,
};

export const defaultPatient = {
  age: 52,
  sex: 1,
  dataset: "Cleveland",
  cp: 1,
  trestbps: 128,
  chol: 210,
  fbs: 0,
  restecg: 0,
  thalach: 154,
  exang: 0,
  oldpeak: 1.0,
  slope: 1,
  ca: 0,
  thal: 0,
};

export function readStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
